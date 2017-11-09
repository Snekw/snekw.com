/**
 *  snekw.com,
 *  Copyright (C) 2017 Ilkka Kuosmanen
 *
 *  This file is part of snekw.com.
 *
 *  snekw.com is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  snekw.com is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with snekw.com.  If not, see <http://www.gnu.org/licenses/>.
 */
'use strict';
const express = require('express');
const debug = require('debug')('App');
const logger = require('morgan');
const rfs = require('rotating-file-stream');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const config = require('../helpers/configStub')('main');
const session = require('express-session');
const RedisSessionStore = require('connect-redis')(session);
const passport = require('passport');
const auth = require('../lib/auth');
const normalizeError = require('./Error').normalizeError;
const HbsViews = require('./hbsViews');
const hbsSystem = require('./hbsSystem');
const helmet = require('helmet');
const csrf = require('csurf');
const redis = require('redis');
const client = redis.createClient({
  password: config.db.redis.password
});

// Application start
debug('App start');
let app = express();
app.use(helmet({
  hsts: false // done on nginx side
}));

// Express is behind NGINX proxy so we need to trust it
app.set('trust proxy', '127.0.0.1');

debug('Db setup started');
require('../db/controller');

app.use(bodyParser.urlencoded({
  extended: true,
  limit: '5mb'
}));

// Max age of 7 days
const sessionCookieTTL = 1000 * 60 * 60 * 24 * 7;

let sessionOpts = {
  secret: config.server.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: sessionCookieTTL
  }
};

if (config.DEV === false) {
  sessionOpts.store = new RedisSessionStore({
    db: 1
  });
  sessionOpts.cookie.secure = true;
}

app.use(session(sessionOpts));
app.use(csrf());

// Auth
auth.setupPassport();
app.use(passport.initialize());
app.use(passport.session());

// Logger
if (config.DEV === true) {
  app.use(logger('dev'));
} else if (config.server.logsEnabled === true) {
  let logDir = path.join(__dirname, '../', config.server.logDir);
  fs.existsSync(logDir) || fs.mkdirSync(logDir);
  const logStream = rfs('accessLog.log', {
    interval: '1d',
    path: logDir
  });
  app.use(logger('combined', {stream: logStream}));
}

// Recompile handlebars on each request on developer mode if enabled on devSettings
if (config.DEV === true && config.devSettings) {
  if (config.devSettings.recompileHBS === true) {
    app.use(function (req, res, next) {
      if (req.originalUrl.indexOf('.css') > -1 || req.originalUrl.indexOf('.ico') > -1) {
        return next();
      }
      hbsSystem.reloadPartials();
      hbsSystem.recompileAll();
      debug('HbsViews recompiled!');
      next();
    });
  }
  if (config.devSettings.invalidateCache) {
    app.use(function (req, res, next) {
      client.flushall();
      debug('Redis cache invalidated!');
      next();
    });
  }
}

// Serve static files with express only in testing environment
// NGINX handles serving static files in production
if (config.DEV === true) {
  app.use('/static', express.static('./src/static'));
}

app.use(function (req, res, next) {
  if (req.user) {
    res.set('Cache-Control', 'private, must-revalidate');
  } else {
    res.set('Cache-Control', 'public, must-revalidate');
  }
  next();
});

app.use(hbsSystem.middleware);

// Routing
debug('Routing');
app.use('', require('./routes/base'));
app.use('', auth.getRoutes());
app.use('/project', require('./routes/project'));
app.use('/user', require('./routes/user'));
app.use('/archive', require('./routes/archive'));
app.use('/about', require('./routes/about'));
app.use('/admin', require('./routes/admin/home'));

function error404 (req, res, next) {
  let err = new Error('Not found');
  err.status = 404;
  err.message = req.originalUrl;
  req.context.error = normalizeError(err);
  res.send(HbsViews.error404.get.hbs(req.context));
}

// Error handler
function errorHandler (err, req, res, next) {
  let status = err.status || 500;
  res.status(status);
  req.context.error = normalizeError(err);
  res.send(HbsViews.error.get.hbs(req.context));
}

app.use(error404);
app.use(errorHandler);

module.exports = app;
