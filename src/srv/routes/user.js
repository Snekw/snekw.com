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
const auth0Api = require('../../lib/auth0Api');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
const HbsViews = require('../hbsSystem').views;
const router = require('express').Router();
const validator = require('validator');
const normalizeError = require('../Error').normalizeError;

router.get('/update', ensureLoggedIn, function (req, res, next) {
  req.context.csrfToken = req.csrfToken();
  res.send(HbsViews.user.manage.hbs(req.context));
});

router.post('/update/username', ensureLoggedIn, function (req, res, next) {
  if (validator.matches(req.body.username, /^[a-zA-Z0-9-_]+$/g)) {
    const opts = {
      method: 'PATCH',
      url: 'users/' + req.user.id,
      body: JSON.stringify({
        app_metadata: {
          username: req.body.username
        }
      })
    };
    auth0Api.queryApi(opts, function (err, body) {
      if (err) {
        return next(err);
      }
      req.user.username = body.app_metadata.username;
      req.user.app_metadata = body.app_metadata;
      return res.redirect('/user');
    });
  } else {
    res.status(400);
    req.context.csrfToken = req.csrfToken();
    req.context.error = normalizeError(new Error('Bad username'));
    res.send(HbsViews.user.manage.hbs(req.context));
  }
});

router.post('/update/picture', ensureLoggedIn, function (req, res, next) {
  if (validator.isURL(req.body.imgUrl) || validator.isDataURI(req.body.imgUrl)) {
    const opts = {
      method: 'PATCH',
      url: 'users/' + req.user.id,
      body: JSON.stringify({
        user_metadata: {
          picture: req.body.imgUrl
        }
      })
    };
    auth0Api.queryApi(opts, function (err, body) {
      if (err) {
        return next(err);
      }
      req.user.picture = body.user_metadata.picture;
      req.user.user_metadata = body.user_metadata;
      return res.redirect('/user');
    });
  } else {
    res.status(400);
    req.context.csrfToken = req.csrfToken();
    req.context.error = normalizeError(new Error('Bad url'));
    res.send(HbsViews.user.manage.hbs(req.context));
  }
});

module.exports = router;
