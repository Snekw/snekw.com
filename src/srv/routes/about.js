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
const HbsViews = require('../HbsViews');
const models = require('../../db/models.js');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
const processMarkdown = require('../processMarkdown');

router.get('/', function (req, res, next) {
  models.about.findOne({active: true}).lean().select('body author postedAt,').exec((err, data) => {
    if (err) {
      return next(err);
    }
    req.context.about = data;
    req.context.csrfToken = req.csrfToken();
    res.send(HbsViews.views.about(req.context));
  });
});

router.get('/new', ensureLoggedIn, function (req, res, next) {
  req.context.csrfToken = req.csrfToken();
  res.send(HbsViews.views.newAbout(req.context));
});

router.post('/new', ensureLoggedIn, function (req, res, next) {
  if (!req.body.author || !req.body.body) {
    req.context.error = new Error('Bad arguments');
    return res.send(HbsViews.views.error(req.context));
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
      res.redirect('/about');
    }).catch(err => {
      return next(err);
    });
  });
});

module.exports = router;
