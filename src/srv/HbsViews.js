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

function getHbs (path) {
  return fs.readFileSync('./src/views/' + path).toString();
}

function getPartialHbs (partial) {
  return getHbs('partials/' + partial);
}

function recompile (views) {
  views.forEach((view) => {
    hbsViews[view] = hbs.compile(getHbs(view + '.hbs'));
  });
}

const partials = {
  layout: getPartialHbs('layout.hbs'),
  nav: getPartialHbs('nav.hbs'),
  projectBrief: getPartialHbs('projectBrief.hbs'),
  markdownEditor: getPartialHbs('markdownEditor.hbs')
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
    opts.fn(this);
  } else {
    opts.inverse(this);
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

hbs.registerPartial(partials);

const hbsViews = {
  index: hbs.compile(getHbs('index.hbs')),
  user: hbs.compile(getHbs('user.hbs')),
  error: hbs.compile(getHbs('error.hbs')),
  project: hbs.compile(getHbs('project.hbs')),
  newProject: hbs.compile(getHbs('newProject.hbs')),
  manageUser: hbs.compile(getHbs('manageUser.hbs')),
  error404: hbs.compile(getHbs('error404.hbs')),
  archive: hbs.compile(getHbs('archive.hbs')),
  about: hbs.compile(getHbs('about.hbs')),
  newAbout: hbs.compile(getHbs('newAbout.hbs'))
};

function middleware (req, res, next) {
  req.context = {
    user: req.user
  };
  next();
}

module.exports = {
  views: hbsViews,
  recompile: recompile,
  reloadPartials: reloadPartials,
  middleware: middleware
};
