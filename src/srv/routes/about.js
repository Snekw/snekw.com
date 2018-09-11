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
const models = require('../../db/models.js');
const querys = require('../../db/querys');
const ensureAdmin = require('../../lib/ensureAdmin');
const processMarkdown = require('../processMarkdown');
const cachedData = require('../../db/CachedData');
const articleLib = require('../../lib/articleLib');

router.get('/', function (req, res, next) {
  cachedData.getCachedOrDb('about', querys.aboutGetQuery).then(data => {
    req.context.isAbout = true;
    req.context.about = data;
    req.context.title = articleLib.createTitle('About');
    return next();
  }).catch(err => {
    return next(err);
  });
});

router.get('/new', ensureAdmin, function (req, res, next) {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  req.context.csrfToken = req.csrfToken();
  return next();
});

router.get('/edit/:id', ensureAdmin, function (req, res, next) {
  models.about.findById(req.params.id).lean().exec((err, about) => {
    if (err) {
      return next(err);
    }
    req.context.csrfToken = req.csrfToken();
    req.context.about = about;
    req.context.isEdit = true;
    return next();
  });
});

router.post('/edit', ensureAdmin, function (req, res, next) {
  if (!req.body.body || !req.body.aboutId) {
    return next(new Error('Body and aboutId are required'));
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

  models.about.findByIdAndUpdate(req.body.aboutId, update, (err) => {
    if (err) {
      return next(err);
    }
    cachedData.updateCache(cachedData.keys.about, querys.aboutGetQuery)
      .then(() => {
        return res.redirect('/about');
      })
      .catch(err => {
        console.log(err);
      });
  });
});

router.post('/newGet', ensureAdmin, function (req, res, next) {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  if (!req.body.author || !req.body.body) {
    req.context.error = new Error('Bad arguments');
    return next();
  }

  let rendered = processMarkdown(req.body.body);

  // eslint-disable-next-line
  let newAbout = new models.about({
    body: rendered,
    rawBody: req.body.body,
    author: req.body.author,
    active: false
  });

  newAbout.save((err, about) => {
    if (err) {
      return next(err);
    }
    models.about.setActive(about._id).then(() => {
      cachedData.updateCache(cachedData.keys.about, querys.aboutGetQuery).then(() => {
        res.redirect('/about');
      }).catch(err => {
        return next(err);
      });
    }).catch(err => {
      return next(err);
    });
  });
});

router.get('/delete/:id', ensureAdmin, function (req, res, next) {
  models.about.findById(req.params.id).lean().exec((err, data) => {
    if (err) {
      return next(err);
    }
    if (!data) {
      return next(new Error('No about found'));
    }

    req.context.about = data;
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    req.context.csrfToken = req.csrfToken();
    return next();
  });
});

router.post('/delete', ensureAdmin, function (req, res, next) {
  if (!req.body.delete || req.body.delete !== 'on') {
    return res.redirect('/');
  }

  models.about.findByIdAndRemove(req.body.id).exec((err) => {
    if (err) {
      return next(err);
    }
    cachedData.updateCache(cachedData.keys.about, querys.aboutGetQuery).then(() => {
      return res.redirect('/about');
    }).catch(() => {
      return res.redirect('/about');
    });
  });
});

module.exports = router;
