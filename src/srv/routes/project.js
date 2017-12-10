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
const models = require('../../db/models.js');
const ensureAdmin = require('../../lib/ensureAdmin');
const cachedData = require('../../db/CachedData');
const auth0Api = require('../../lib/auth0Api');
const processMarkdown = require('../processMarkdown');
const querys = require('../../db/querys');
const validator = require('validator');
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
  if (!validator.matches(project, /^[a-zA-Z0-9_-]+$/g)) {
    let err = new Error('Invalid project id');
    return next(err);
  }

  let query = models.project.findById(project).lean();

  cachedData.getCachedOrDb(project, query)
    .then((data) => {
      if (!data) {
        return next();
      }
      req.context.project = data;
      let author = data.author;
      if (data.author && typeof data.author !== 'string') {
        author = data.author.id;
      }

      const opts = {
        method: 'GET',
        url: 'users',
        qs: {
          q: 'user_id:"' + author + '"'
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
    })
    .catch(err => {
      return next(err);
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
  if (!req.context.project.public) {
    return res.redirect('/');
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

  // Load the project from the database ignoring the cached version
  models.project.findById(req.params.project).lean().exec((err, data) => {
    if (err) {
      return next(err);
    }

    req.context.project = data;
    req.context.csrfToken = req.csrfToken();
    req.context.isEdit = true;

    res.send(HbsViews.project.edit.hbs(req.context));
  });
});

router.post('/edit', ensureAdmin, function (req, res, next) {
  if (!req.body.title || !req.body.body || !req.body.projectId) {
    res.status(400);
    req.context.csrfToken = req.csrfToken();
    req.context.bad = 'Title, body or brief is missing!';
    req.context.isEdit = true;
    req.context.project = {
      rawBody: req.body.body || '',
      title: req.body.title || '',
      brief: req.body.brief || '',
      indexImageUrl: req.body.indexImg || '',
      indexImageAlt: req.body.indexImgAlt || '',
      public: (req.body.public === 'true'),
      _id: req.body.projectId
    };
    res.send(HbsViews.project.edit.hbs(req.context));
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
  if (req.body.public) {
    update.public = (req.body.public === 'true');
  } else {
    update.public = false;
  }

  models.project.findByIdAndUpdate(req.body.projectId, update, (err, data) => {
    if (err) {
      return next(err);
    }
    cachedData.updateCache(data._id, models.project.findById(data._id).lean())
      .then(() => {
        return cachedData.updateCache(cachedData.keys.indexProjects, querys.indexProjectsQuery);
      })
      .then(() => {
        return res.redirect('/project/id/' + req.body.projectId);
      })
      .catch(err => {
        return next(err);
      });
  });
});

router.post('/new', ensureAdmin, function (req, res, next) {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  if (!req.body.title || !req.body.body || !req.body.brief) {
    res.status(400);
    req.context.csrfToken = req.csrfToken();
    req.context.bad = 'Title, body or brief is missing!';
    req.context.project = {
      rawBody: req.body.body || '',
      title: req.body.title || '',
      brief: req.body.brief || '',
      indexImageUrl: req.body.indexImg || '',
      indexImageAlt: req.body.indexImgAlt || ''
    };
    res.send(HbsViews.project.new.hbs(req.context));
  }
  let rendered = processMarkdown(req.body.body);
  let p = (req.body.public === 'true');
  // eslint-disable-next-line
  let newProject = new models.project({
    title: req.body.title,
    body: rendered,
    rawBody: req.body.body,
    indexImageUrl: req.body.indexImg,
    author: {
      id: req.body.postedById,
      username: req.body.postedByName
    },
    brief: req.body.brief,
    public: p
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
