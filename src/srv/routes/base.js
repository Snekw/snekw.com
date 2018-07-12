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
const router = require('express').Router();
const ensureLoggedIn = require('../../lib/ensureLoggedIn');
const HbsViews = require('../hbsSystem').views;
const auth = require('../../lib/auth');
const cache = require('../../db/CachedData');
const normalizeError = require('../ErrorJSONAPI').normalizeError;
const config = require('../../helpers/configStub')('main');
const querys = require('../../db/querys');
auth.setErrorPageFunc(HbsViews.error.get.hbs);

router.get('/', function (req, res, next) {
  cache.getCachedOrDb(cache.keys.indexArticles, querys.indexArticlesQuery).then(data => {
    req.context.articles = data;
    req.template = HbsViews.index.get;
    req.context.meta.description = config.siteBrief || '';
    next();
  }).catch(err => {
    return next(err);
  });
});

router.get('/user', ensureLoggedIn, function (req, res, next) {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  req.template = HbsViews.user.get;
  next();
});

// Used to test the Error page, only enabled in developer mode
if (config.DEV === true) {
  router.get('/err', function (req, res, next) {
    req.context.error = normalizeError(new Error('Test'));
    req.template = HbsViews.error.get;
    next();
  });
}

module.exports = router;
