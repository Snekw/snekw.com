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
const normalizeError = require('../Error').normalizeError;
const models = require('../../db/models.js');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
const cachedData = require('../CachedData');
const auth0Api = require('../../lib/auth0Api');
const commonmark = require('commonmark');
const cmReader = new commonmark.Parser();
const cmRenderer = new commonmark.HtmlRenderer({softbreak: ' ', safe: false});
const Prism = require('prismjs');
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
  models.project.findById(project).lean().exec((err, data) => {
    if (err) {
      res.status(500);
      req.context.error = normalizeError(err);
      return res.send(HbsViews.views.error(req.context));
    }

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
        res.status(500);
        req.context.error = normalizeError(err);
        res.send(HbsViews.views.error(req.context));
        return;
      }
      if (body.length < 1) {
        return next();
      }
      req.context.project.author = {
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
  if (!req.context.project) {
    res.status(404);
    let err = new Error(404);
    err.status = 404;
    err.message = req.originalUrl;
    req.context.error = normalizeError(err);
    return res.send(HbsViews.views.error404(req.context));
  }
  res.send(HbsViews.views.project(req.context));
});

router.get('/new', ensureLoggedIn, function (req, res, next) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  req.context.csrfToken = req.csrfToken();
  res.send(HbsViews.views.newProject(req.context));
});

router.post('/new', ensureLoggedIn, function (req, res, next) {
  if (!req.body.title || !req.body.body) {
    res.status(400);
    // TODO
    res.send(HbsViews.views.newProject({bad: 'Missing data', csrfToken: req.csrfToken()}));
  }
  let parsed = cmReader.parse(req.body.body);

  let walker = parsed.walker();
  let event, node;

  while ((event = walker.next())) {
    node = event.node;
    if (event.entering && node.type === 'code_block') {
      let lang = Prism.languages[node.info];
      let langName = node.info;
      if (!lang) {
        langName = 'bash';
        lang = Prism.languages.bash;
      }
      let newNode = new commonmark.Node('html_block');
      let className = 'language-' + langName;
      newNode.literal = '<pre class="' + className + '"><code class="' +
        className + '">' +
        Prism.highlight(node.literal, lang) + '</code></pre>';
      node.insertBefore(newNode);
      node.unlink();
    }
  }

  let rendered = cmRenderer.render(parsed);
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
      return res.send(HbsViews.views.error(normalizeError(err)));
    }
    cachedData.getProjectsFromMongoose();
    return res.redirect('/project/id/' + data._id);
  });
});

module.exports = router;
