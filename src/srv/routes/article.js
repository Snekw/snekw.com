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
const moment = require('moment');
const articleLib = require('../../lib/articleLib');

router.param('article', function (req, res, next, article) {
  if (!validator.matches(article, /^[a-zA-Z0-9_-]+$/g)) {
    let err = new Error('Invalid article id');
    return next(err);
  }

  let query = models.article.findById(article).lean();

  cachedData.getCachedOrDb(article, query)
    .then((data) => {
      if (!data) {
        return next();
      }
      req.context.article = data;
      req.context.title = articleLib.createTitle(data.title);
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
        req.context.article.author = {
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

router.get('/id/:article', function (req, res, next) {
  if (!req.context.article) {
    res.status(404);
    let err = new Error(404);
    err.status = 404;
    err.message = req.originalUrl;
    return next(err);
  }
  if (req.context.article.public < 1) {
    return res.redirect('/');
  }
  req.context.meta.description = req.context.article.brief;
  req.template = HbsViews.article.get;
  next();
});

router.get('/new', ensureAdmin, function (req, res, next) {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  req.context.csrfToken = req.csrfToken();
  req.template = HbsViews.article.new;
  next();
});

router.get('/edit/:article', ensureAdmin, function (req, res, next) {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');

  // Load the article from the database ignoring the cached version
  models.article.findById(req.params.article).lean().exec((err, data) => {
    if (err) {
      return next(err);
    }

    req.context.article = data;
    req.context.csrfToken = req.csrfToken();
    req.context.isEdit = true;

    req.template = HbsViews.article.edit;
    next();
  });
});

router.post('/edit', ensureAdmin, function (req, res, next) {
  if (!req.body.title || !req.body.body || !req.body.articleId) {
    res.status(400);
    req.context.csrfToken = req.csrfToken();
    req.context.bad = 'Title, body or brief is missing!';
    req.context.isEdit = true;
    req.context.article = {
      rawBody: req.body.body || '',
      title: req.body.title || '',
      brief: req.body.brief || '',
      indexImageUrl: req.body.indexImg || '',
      indexImageAlt: req.body.indexImgAlt || '',
      public: req.body.public || 0,
      _id: req.body.articleId
    };
    req.template = HbsViews.article.edit;
    return next();
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
    update.public = req.body.public;
  }
  if (req.body.editUpdatedAt && req.body.setPublicationTimeToNow) {
    update.postedAt = Date.now();
    update.updatedAt = update.postedAt;
  }
  if (req.body.editUpdatedAt && update.public > 0 && !req.body.setPublicationTimeToNow &&
    req.body.postedAtHours && req.body.postedAtDate && req.body.timeZone) {
    let postedAt = moment.utc(req.body.postedAtDate + 'T' + req.body.postedAtHours + 'Z');
    postedAt.utcOffset(-1 * Number(req.body.timeZone), true);
    update.postedAt = postedAt.toISOString();
    // Set the editedAt time to equal the postedAt time so that the edited on time is
    // not shown on the article page
    update.updatedAt = postedAt.toISOString();
  }

  models.article.findByIdAndUpdate(req.body.articleId, {$set: update}, (err, data) => {
    if (err) {
      return next(err);
    }
    cachedData.updateCache(data._id, models.article.findById(data._id).lean())
      .then(() => {
        return cachedData.updateCache(cachedData.keys.indexArticles, querys.indexArticlesQuery);
      })
      .then(() => {
        return res.redirect('/article/id/' + req.body.articleId);
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
    req.context.article = {
      rawBody: req.body.body || '',
      title: req.body.title || '',
      brief: req.body.brief || '',
      indexImageUrl: req.body.indexImg || '',
      indexImageAlt: req.body.indexImgAlt || ''
    };
    req.template = HbsViews.article.new;
    return next();
  }
  let rendered = processMarkdown(req.body.body);
  let p = (req.body.public === 'true');
  // eslint-disable-next-line
  let newarticle = new models.article({
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

  if (newarticle.public !== 0) {
    newarticle.postedAt = Date.now();
    // Set the editedAt time to equal the postedAt time so that the edited on time is
    // not shown on the article page
    newarticle.updatedAt = newarticle.postedAt;
  }

  newarticle.save((err, data) => {
    if (err) {
      res.status(500);
      return next(err);
    }
    cachedData.setupCache();
    return res.redirect('/article/id/' + data._id);
  });
});

router.get('/delete/:article', ensureAdmin, function (req, res, next) {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');

  req.context.csrfToken = req.csrfToken();

  req.template = HbsViews.article.delete;
  next();
});

router.post('/delete', ensureAdmin, function (req, res, next) {
  if (!req.body.delete || req.body.delete !== 'on') {
    return res.redirect('/');
  }

  models.article.findByIdAndRemove(req.body.id).exec((err) => {
    if (err) {
      return next(err);
    }
    cachedData.setupCache();
    return res.redirect('/');
  });
});

module.exports = router;
