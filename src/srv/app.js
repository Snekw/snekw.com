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
const path = require('path');
const bodyParser = require('body-parser');
const config = require('../helpers/configStub')('main');
const session = require('express-session');
const RedisSessionStore = require('connect-redis')(session);
const favicon = require('serve-favicon');
const passport = require('passport');
const auth = require('../lib/auth');
const normalizeError = require('./Error').normalizeError;
const HbsViews = require('./hbsViews');
const hbsSystem = require('./hbsSystem');
const helmet = require('helmet');
const csrf = require('csurf');
const redis = require('redis');
const dbController = require('../db/controller');

let redisClientOpts = {};
if (config.db.redis.password) {
  redisClientOpts.password = config.db.redis.password;
}

const client = redis.createClient(redisClientOpts);

// Application start
debug('App start');
let app = express();
app.use(helmet({
  hsts: false // done on nginx side
}));

// Express is behind NGINX proxy so we need to trust it
app.set('trust proxy', '127.0.0.1');

debug('Db setup started');
dbController.connect();

app.use(bodyParser.urlencoded({
  extended: true,
  limit: '5mb'
}));
app.use('/api', bodyParser.json());

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

if (config.devSettings.useRedisSession === true || !config.DEV) {
  sessionOpts.store = new RedisSessionStore({
    db: 1
  });
  sessionOpts.cookie.secure = true;
}

// Disable the need for HTTPS on DEV
if (config.DEV || process.env.NODE_ENV === 'test') {
  sessionOpts.cookie.secure = false;
}

app.use(session(sessionOpts));
app.use(csrf({cookie: false}));

// Auth
auth.setupPassport();
app.use(passport.initialize());
app.use(passport.session());

// Logger
if (process.env.NODE_ENV !== 'test') {
  if (config.DEV === true) {
    app.use(logger('dev'));
  }
}

// API routes - NO CSRF
app.use('/api/article', require('./api/article'));
app.use('/api/upload', require('./api/upload'));

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
  app.use('/static', express.static('./static'));
}

app.use(function (req, res, next) {
  if (req.user) {
    res.set('Cache-Control', 'private, must-revalidate');
    if (req.originalUrl.indexOf('.css') > -1 ||
      req.originalUrl.indexOf('.js') > -1 ||
      req.originalUrl.indexOf('.ico') > -1) {
      return next();
    }
    if (req.method === 'GET' &&
      req.user.username === '' &&
      req.originalUrl !== '/user/update' &&
      req.originalUrl !== '/logout') {
      return res.redirect('/user/update');
    }
  } else {
    res.set('Cache-Control', 'public, must-revalidate');
  }
  next();
});

app.use(favicon(path.join(__dirname, '../static/favicon.ico')));

app.use(hbsSystem.middleware);

// Routing - WITH CSRF
debug('Routing');
app.use('', require('./routes/base'));
app.use('', auth.getRoutes());
app.use('/article', require('./routes/article'));
app.use('/user', require('./routes/user'));
app.use('/archive', require('./routes/archive'));
app.use('/about', require('./routes/about'));
app.use('/admin', require('./routes/admin/home'));

// The final middleware to do the rendering of the templates
app.use(function (req, res, next) {
  if (process.env.NODE_ENV === 'test') {
    return res.json({context: req.context, user: req.user});
  }
  if (!req.template) {
    return next(new Error('Missing template for route: ' + res.originalUrl));
  }
  req.context.meta = Object.assign({}, req.template.meta, req.context.meta);
  return res.send(req.template.hbs(req.context));
});

function error404 (req, res, next) {
  let err = new Error('Not found');
  err.status = 404;
  err.message = req.originalUrl;
  req.context = req.context || {};
  req.context.error = normalizeError(err);

  if (process.env.NODE_ENV === 'test') {
    return res.json({context: req.context, user: req.user});
  }
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(err.status).json({
      error: req.context.error
    });
  }
  req.context.meta = Object.assign({}, HbsViews.error404.get.meta, req.context.meta);
  res.send(HbsViews.error404.get.hbs(req.context));
}

// Error handler
function errorHandler (err, req, res, next) {
  let status = err.status || 500;
  res.status(status);
  req.context = req.context || {};
  req.context.error = normalizeError(err);

  if (process.env.NODE_ENV === 'test') {
    return res.json({context: req.context, user: req.user});
  }
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(status).json({
      error: req.context.error
    });
  }
  req.context.meta = Object.assign({}, HbsViews.error.get.meta, req.context.meta);
  res.send(HbsViews.error.get.hbs(req.context));
}

app.use(error404);
app.use(errorHandler);

module.exports = app;
