/**
 * Copyright (c) 2017 Ilkka Kuosmanen
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR
 * THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
'use strict';
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
const HbsViews = require('./HbsViews');
const auth = require('../lib/auth');
const cache = require('./CachedData');
const normalizeError = require('./Error').normalizeError;
const config = require('../helpers/configStub')('main');
auth.setErrorPageFunc(HbsViews.views.error);

module.exports = function (app) {
  app.get('/', function (req, res, next) {
    cache.getProjects().then(data => {
      if (req.user) {
        res.set('Cache-Control', 'private, max-age=36000');
      } else {
        res.set('Cache-Control', 'public, max-age=36000');
      }
      res.send(HbsViews.views.index({user: req.user, projects: data}));
    }).catch(err => {
      res.send(HbsViews.views.error(normalizeError(err)));
    });
  });

  app.get('/user', ensureLoggedIn, function (req, res, next) {
    res.send(HbsViews.views.user({user: req.user}));
  });

// Used to test the Error page, only enabled in developer mode
  if (config.DEV === true) {
    app.get('/err', function (req, res, next) {
      HbsViews.recompile(['error']);
      res.send(HbsViews.views.error(normalizeError(new Error('Test'))));
    });
  }
};
