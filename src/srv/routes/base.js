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
const cache = require('../../db/CachedData');
const normalizeError = require('../ErrorJSONAPI').normalizeError;
const config = require('../../helpers/configStub')('main');
const sm = require('sitemap');
const articleLib = require('../../lib/articleLib');
const querys = require('../../db/querys');
// auth.setErrorPageFunc(HbsViews.error.get.hbs);

const out = {};

out.index = (req, res, next) => {
  cache.getCachedOrDb(cache.keys.indexArticles, querys.indexArticlesQuery).then(data => {
    req.context.articles = data;
    req.context.meta.description = config.siteBrief || '';
    next();
  }).catch(err => {
    return next(err);
  });
};

let siteMapGeneratedTimeStamp = 0;
const siteMapValidFor = 60 * 60 * 1000;
const sitemap = sm.createSitemap({
  hostname: config.hostname,
  cacheTime: 600000,
  urls: [
    {url: '/archive', changefreq: 'weekly'},
    {url: '/about'}
  ]
});

function sendSitemap (res, next) {
  sitemap.toXML((err, xml) => {
    if (err) {
      return next(err);
    } else {
      res.header('Content-Type', 'application/xml');
      res.send(xml);
    }
  });
}

out.sitemap = (req, res, next) => {
  if (siteMapGeneratedTimeStamp + siteMapValidFor < Date.now()) {
    querys.getArticleIds.exec()
      .then(data => {
        if (!data) {
          return next('No data');
        }
        return Promise.all(data.map(article => articleLib.getSiteMapInfo(article._id)));
      })
      .then(articles => {
        articles.forEach(article => {
          sitemap.del(article);
          sitemap.add(article);
        });
        siteMapGeneratedTimeStamp = Date.now();
        return sendSitemap(res, next);
      })
      .catch(err => {
        return next(err);
      });
  } else {
    return sendSitemap(res, next);
  }
};

// Used to test the Error page, only enabled in developer mode
if (config.DEV === true) {
  router.get('/err', function (req, res, next) {
    req.context.error = normalizeError(new Error('Test'));
    next();
  });
}

module.exports = out;
