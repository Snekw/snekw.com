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
const HbsViews = require('../hbsSystem').views;
const normalizeError = require('../Error').normalizeError;
const models = require('../../db/models.js');
const ensureAdmin = require('../../lib/ensureAdmin');
const cachedData = require('../../db/CachedData');
const auth0Api = require('../../lib/auth0Api');
const processMarkdown = require('../processMarkdown');
const querys = require('../../db/querys');
require('prismjs/components/prism-javascript');
require('prismjs/components/prism-markdown');
require('prismjs/components/prism-c');
require('prismjs/components/prism-cpp');
require('prismjs/components/prism-csharp');
require('prismjs/components/prism-bash');
require('prismjs/components/prism-handlebars');
require('prismjs/components/prism-scss');
require('prismjs/components/prism-css');
require('prismjs/components/prism-http');

router.param('project', function (req, res, next, project) {
  let query = models.project.findById(project).lean();

  cachedData.getCachedOrDb(project, query, false)
    .catch(err => {
      res.status(500);
      req.context.error = normalizeError(err);
      return res.send(HbsViews.views.error(req.context));
    })
    .then((data) => {
      if (!data) {
        return next();
      }
      req.context.project = data;

      const opts = {
        method: 'GET',
        url: 'users',
        qs: {
          q: 'user_id:"' + data.author + '"'
        }
      };

      auth0Api.queryApi(opts, function (err, body) {
        if (err) {
          return next(err);
        }
        if (!body.length) {
          return next();
        }
        body = body[0];
        req.context.project.author = {
          username: body.app_metadata.username,
          id: body.user_id,
          picture: body.picture,
          app_metadata: body.app_metadata || {},
          user_metadata: body.user_metadata || {},
          locale: body.locale
        };
        next();
      });
    });
});

router.get('/id/:project', function (req, res, next) {
  if (!req.context.project) {
    res.status(404);
    let err = new Error(404);
    err.status = 404;
    err.message = req.originalUrl;
    return next(err);
  }
  res.send(HbsViews.project.get.hbs(req.context));
});

router.get('/new', ensureAdmin, function (req, res, next) {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  req.context.csrfToken = req.csrfToken();
  res.send(HbsViews.project.new.hbs(req.context));
});

router.get('/edit/:project', ensureAdmin, function (req, res, next) {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');

  req.context.csrfToken = req.csrfToken();

  res.send(HbsViews.project.edit.hbs(req.context));
});

router.post('/edit', ensureAdmin, function (req, res, next) {
  if (!req.body.body || !req.body.projectId) {
    return next(new Error('Body and project id are required'));
  }

  let rendered = processMarkdown(req.body.body);

  let update = {
    rawBody: req.body.body,
    body: rendered,
    updatedAt: Date.now()
  };

  if (req.body.title) {
    update.title = req.body.title;
  }
  if (req.body.indexImg) {
    update.indexImageUrl = req.body.indexImg;
  }
  if (req.body.brief) {
    update.brief = req.body.brief;
  }

  models.project.findByIdAndUpdate(req.body.projectId, update, (err) => {
    if (err) {
      return next(err);
    }
    cachedData.updateCache(cachedData.keys.indexProjects, querys.indexProjectsQuery).then(() => {
      return res.redirect('/project/id/' + req.body.projectId);
    }).catch(err => {
      return next(err);
    });
  });
});

router.post('/new', ensureAdmin, function (req, res, next) {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  if (!req.body.title || !req.body.body) {
    res.status(400);
    // TODO
    res.send(HbsViews.project.new.hbs({bad: 'Missing data', csrfToken: req.csrfToken()}));
  }
  let rendered = processMarkdown(req.body.body);
  // eslint-disable-next-line
  let newProject = new models.project({
    title: req.body.title,
    body: rendered,
    rawBody: req.body.body,
    indexImageUrl: req.body.indexImg,
    author: req.body.postedBy,
    brief: req.body.brief
  });

  newProject.save((err, data) => {
    if (err) {
      res.status(500);
      return next(err);
    }
    cachedData.updateCache(cachedData.keys.indexProjects, querys.indexProjectsQuery).then(() => {
      return res.redirect('/project/id/' + data._id);
    }).catch(err => {
      return next(err);
    });
  });
});

router.get('/delete/:project', ensureAdmin, function (req, res, next) {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');

  req.context.csrfToken = req.csrfToken();

  res.send(HbsViews.project.delete.hbs(req.context));
});

router.post('/delete', ensureAdmin, function (req, res, next) {
  if (!req.body.delete || req.body.delete !== 'on') {
    return res.redirect('/');
  }

  models.project.findByIdAndRemove(req.body.id).exec((err) => {
    if (err) {
      return next(err);
    }
    cachedData.updateCache(cachedData.keys.indexProjects, querys.indexProjectsQuery).then(() => {
      return res.redirect('/');
    }).catch(err => {
      return next(err);
    });
  });
});

module.exports = router;
