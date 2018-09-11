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

function getHbs (path) {
  let pathStart = './views/';
  return fs.readFileSync(pathStart + path).toString();
}

function getPartialHbs (partial) {
  return getHbs('./partials/' + partial);
}

function compile (view) {
  let hbsTemplatePath = `./views/${view}.hbs`;
  return hbs.compile(fs.readFileSync(hbsTemplatePath).toString());
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

hbs.registerHelper('if_less', function (a, b, opts) {
  if (a < b) {
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

hbs.registerHelper('scriptBundles', function (bundles) {
  return getScriptBundle(bundles, 'js', '<script src="$val"></script>');
});

hbs.registerHelper('css', function (cssFiles) {
  return getScriptBundle(cssFiles, 'css', '<link rel="stylesheet" href="$val"/>');
});

function getScriptBundle (bundles, ext, template) {
  bundles = bundles.split(' ');
  let extension = !config.DEV && !config.devSettings.useMinified ? `.min.${ext}` : `.${ext}`;
  return new hbs.SafeString(bundles.map(b => {
    let tp = '';
    const prefix = '!min!';
    if (b.startsWith(prefix)) {
      b = b.slice(prefix.length, b.length);
      extension = `.min.${ext}`;
    }
    return `/static/${ext}${tp}/${b}${extension}`;
  })
    .reduce((acc, val) => acc + template.replace(/\$val/g, val), ''));
}

function getSrcSet (imagePath) {
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
}

hbs.registerHelper('imageSrcSet', function (imagePath) {
  return getSrcSet(imagePath);
});

hbs.registerHelper('getImgThumbnail', function (imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  const thumbPath = image.getThumbnailPath(imagePath);
  return image.fixPath(fs.existsSync(thumbPath) ? thumbPath : imagePath);
});

hbs.registerPartial(partials);

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
  compile,
  reloadPartials,
  middleware,
  getSrcSet
};
