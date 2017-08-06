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
const HbsViews = require('./HbsViews');
const normalizeError = require('./Error').normalizeError;
const models = require('../db/models.js');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
const validator = require('validator');
const cachedData = require('./CachedData');
const auth0Api = require('../lib/auth0Api');

router.param('project', function (req, res, next, project) {
  models.project.findById(project).lean().exec((err, data) => {
    if (err) {
      res.status(500);
      return res.send(HbsViews.views.error(normalizeError(err)));
    }

    req.project = data;

    const opts = {
      method: 'GET',
      url: 'users',
      qs: {
        q: 'user_id:"' + data.author + '"'
      }
    };

    auth0Api.queryApi(opts, function (err, body) {
      if (err) {
        res.status(500);
        res.send(HbsViews.views.error(normalizeError(err)));
        return;
      }
      req.project.author = {
        username: body[0].app_metadata.username,
        id: body[0].user_id,
        picture: body[0].picture,
        app_metadata: body[0].app_metadata || {},
        user_metadata: body[0].user_metadata || {},
        locale: body[0].locale
      };
      next();
    });

  });
});

router.get('/id/:project', function (req, res, next) {
  if (!req.project) {
    res.status(404);
    let err = new Error(404);
    err.status = 404;
    // TODO separate page for 404
    return res.send(HbsViews.views.error(normalizeError(err)));
  }
  if (req.user) {
    res.set('Cache-Control', 'private, max-age=36000');
  } else {
    res.set('Cache-Control', 'public, max-age=36000');
  }
  res.send(HbsViews.views.project({user: req.user, project: req.project}));
});

router.get('/new', function (req, res, next) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.send(HbsViews.views.newProject({csrfToken: req.csrfToken()}));
});

router.post('/new', ensureLoggedIn, function (req, res, next) {
  if (!req.body.title || !req.body.body) {
    res.status(400);
    res.send(HbsViews.views.newProject({bad: 'Missing data', csrfToken: req.csrfToken()}));
  }
  // eslint-disable-next-line
  let newProject = new models.project({
    title: req.body.title,
    body: req.body.body,
    indexImageUrl: req.body.indexImg
  });

  newProject.save((err, data) => {
    if (err) {
      res.status(500);
      return res.send(HbsViews.views.error(normalizeError(err)));
    }
    cachedData.getProjectsFromMongoose();
    return res.redirect('/project/id/' + data._id);
  });
});

module.exports = router;
