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
const HbsViews = require('../../hbsSystem').views;
const models = require('../../../db/models.js');
const ensureAdmin = require('../../../lib/ensureAdmin');
const cachedData = require('../../../db/CachedData');
const auth0Api = require('../../../lib/auth0Api');

let adminPages = {};

for (let item in HbsViews.admin) {
  if (item === 'base') {
    continue;
  }
  if (HbsViews.admin.hasOwnProperty(item)) {
    adminPages[item] = {};
    adminPages[item].active = false;
    adminPages[item].name = item.toLowerCase();
    adminPages[item].longName = HbsViews.admin[item].name || 'ERR! NO NAME';
    adminPages[item].icon = HbsViews.admin[item].icon || 'face';
  }
}

router.use(function (req, res, next) {
  req.context.adminPages = {};
  for (let key in adminPages) {
    if (adminPages.hasOwnProperty(key)) {
      req.context.adminPages[key] = Object.assign({}, adminPages[key]);
    }
  }
  next();
});

router.get(['', '/dashboard'], ensureAdmin, function (req, res, next) {
  req.context.adminPages['dashboard'].active = true;
  res.send(HbsViews.admin.dashboard.hbs(req.context));
});
router.get('/statistics', ensureAdmin, function (req, res, next) {
  req.context.adminPages['statistics'].active = true;
  res.send(HbsViews.admin.statistics.hbs(req.context));
});

router.get('/manageprojects', ensureAdmin, function (req, res, next) {
  req.context.adminPages['manageProjects'].active = true;

  models.project.find()
    .sort('-postedAt')
    .lean()
    .then(data => {
      if (!data) {
        return next(new Error('No data'));
      }
      // Add default image if there is no image set
      data.map(d => {
        d.indexImageUrl = (d.indexImageUrl)
          ? d.indexImageUrl
          : 'https://i.imgur.com/5Dmkrgz.png';
      });
      req.context.projects = data;
      res.send(HbsViews.admin.manageProjects.hbs(req.context));
    })
    .catch(err => {
      return next(err);
    });

});

module.exports = router;
