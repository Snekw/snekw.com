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
const image = require('../lib/api/image');
const path = require('path');

function getHbs (path) {
  let pathStart = './views/';
  return fs.readFileSync(pathStart + path).toString();
}

function getPartialHbs (partial) {
  return getHbs('./partials/' + partial);
}

function recompileAll () {
  for (let view in HbsViews) {
    if (view === 'base') {
      continue;
    }
    if (HbsViews.hasOwnProperty(view)) {
      for (let inner in HbsViews[view]) {
        if (inner === 'base' || inner === 'meta') {
          continue;
        }
        if (HbsViews[view].hasOwnProperty(inner)) {
          HbsViews[view].base = HbsViews[view].base || '';
          HbsViews[view][inner].hbs = hbs.compile(
            getHbs(HbsViews[view].base + HbsViews[view][inner].path)
          );
          HbsViews[view].meta = HbsViews[view].meta || {};
          HbsViews[view][inner].meta = HbsViews[view][inner].meta || {};
          HbsViews[view][inner].meta = Object.assign({}, HbsViews[view].meta,
            HbsViews[view][inner].meta);
        }
      }
    }
  }
}

const partials = {
  layout: getPartialHbs('layout.hbs'),
  nav: getPartialHbs('nav.hbs'),
  articleBrief: getPartialHbs('articleBrief.hbs'),
  markdownEditor: getPartialHbs('markdownEditor.hbs'),
  editControls: getPartialHbs('editControls.hbs'),
  adminLayout: getPartialHbs('adminLayout.hbs'),
  adminNav: getPartialHbs('adminNav.hbs'),
  adminNavItem: getPartialHbs('adminNavItem.hbs'),
  adminArticle: getPartialHbs('adminArticle.hbs'),
  upload: getPartialHbs('upload.hbs'),
  uploadBrowser: getPartialHbs('uploadBrowser.hbs'),
  uploadBrowserTemplate: getPartialHbs('uploadBrowserTemplate.hbs')
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

hbs.registerHelper('fixImagePath', function (path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return image.fixPath(path);
});

hbs.registerHelper('imageSrcSet', function (imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return '';
  const images = image.getAltImageNames(imagePath);
  if (!images || images.length === 0) return '';
  let result = '';
  images.forEach((img) => {
    const match = image.isGenerated(img);
    if (!match) return;
    result = `${result}/${img} ${match}w,`;
  });
  return result.slice(0, -1);
});

hbs.registerHelper('getImgThumbnail', function (imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  const thumbPath = image.getThumbnailPath(imagePath);
  return image.fixPath(fs.existsSync(thumbPath) ? thumbPath : imagePath);
});

hbs.registerPartial(partials);

recompileAll();

function middleware (req, res, next) {
  req.context = {
    user: req.user,
    title: config.siteName,
    meta: {
      description: ''
    }
  };

  next();
}

module.exports = {
  views: HbsViews,
  recompileAll: recompileAll,
  reloadPartials: reloadPartials,
  middleware: middleware
};
