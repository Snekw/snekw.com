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

function getHbs (path) {
  return fs.readFileSync('./views/' + path).toString();
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
  project: getPartialHbs('project.hbs'),
  indexProject: getPartialHbs('indexProject.hbs')
};

function reloadPartials () {
  Object.keys(partials).forEach(partial => {
    hbs.registerPartial(partial, getPartialHbs(partial + '.hbs'));
  });
}

hbs.registerPartial(partials);

const hbsViews = {
  index: hbs.compile(getHbs('index.hbs')),
  user: hbs.compile(getHbs('user.hbs')),
  error: hbs.compile(getHbs('error.hbs')),
  project: hbs.compile(getHbs('project.hbs')),
  newProject: hbs.compile(getHbs('newProject.hbs'))
};

module.exports = {
  views: hbsViews,
  recompile: recompile,
  reloadPartials: reloadPartials
};
