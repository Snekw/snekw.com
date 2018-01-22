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
const hbs = require('hbs');
const fs = require('fs');
const moment = require('moment');
let HbsViews = require('./hbsViews');
const config = require('../helpers/configStub')('main');

function getHbs (path) {
  let pathStart = './dist/views/';
  if (config.DEV === true) {
    pathStart = './src/views/';
  }
  return fs.readFileSync(pathStart + path).toString();
}

function getPartialHbs (partial) {
  return getHbs('partials/' + partial);
}

function recompileAll () {
  for (let view in HbsViews) {
    if (view === 'base') {
      continue;
    }
    if (HbsViews.hasOwnProperty(view)) {
      for (let inner in HbsViews[view]) {
        if (inner === 'base') {
          continue;
        }
        if (HbsViews[view].hasOwnProperty(inner)) {
          HbsViews[view].base = HbsViews[view].base || '';
          HbsViews[view][inner].hbs = hbs.compile(
            getHbs(HbsViews[view].base + HbsViews[view][inner].path)
          );
        }
      }
    }
  }
}

const partials = {
  layout: getPartialHbs('layout.hbs'),
  nav: getPartialHbs('nav.hbs'),
  projectBrief: getPartialHbs('projectBrief.hbs'),
  markdownEditor: getPartialHbs('markdownEditor.hbs'),
  editControls: getPartialHbs('editControls.hbs'),
  adminLayout: getPartialHbs('adminLayout.hbs'),
  adminNav: getPartialHbs('adminNav.hbs'),
  adminNavItem: getPartialHbs('adminNavItem.hbs'),
  adminProject: getPartialHbs('adminProject.hbs')
};

function reloadPartials () {
  Object.keys(partials).forEach(partial => {
    hbs.registerPartial(partial, getPartialHbs(partial + '.hbs'));
  });
}

hbs.registerHelper('formatTime', function (date, format) {
  let mmnt = moment(date);
  return mmnt.format(format);
});

hbs.registerHelper('if_eq', function (a, b, opts) {
  if (a === b) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
});

hbs.registerHelper('if_neq', function (a, b, opts) {
  if (a !== b) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
});

hbs.registerHelper('timeFromNow', function (time) {
  return moment(time).fromNow();
});

hbs.registerHelper('getDateString', function (mongooseDate) {
  return moment(mongooseDate).format('YYYY-MM-DD');
});

hbs.registerHelper('getTimeString', function (mongooseDate) {
  return moment(mongooseDate).format('hh:mm');
});

hbs.registerPartial(partials);

recompileAll();

function middleware (req, res, next) {
  req.context = {
    user: req.user
  };

  next();
}

module.exports = {
  views: HbsViews,
  recompileAll: recompileAll,
  reloadPartials: reloadPartials,
  middleware: middleware
};
