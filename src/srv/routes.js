/**
 *  snekw.com,
 *  Copyright (C) 2018 Ilkka Kuosmanen
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
const ensureLoggedIn = require('../lib/ensureLoggedIn');
const ensureAdmin = require('../lib/ensureAdmin');
const hbsSystem = require('./hbsSystem');

const base = require('./routes/base');
const user = require('./routes/user');
const article = require('./routes/article');
const archive = require('./routes/archive');
const about = require('./routes/about');
const admin = require('./routes/admin/home');

const apiArticle = require('./api/article');
const apiUpload = require('./api/upload');

const routeDefinitions = [
  {
    url: '/',
    sitemap: true,
    get: {
      view: 'index',
      handler: base.index
    }
  },
  {
    url: '/sitemap.xml',
    sitemap: true,
    get: {
      handler: base.sitemap
    }
  },
  // User
  {
    url: '/user',
    get: {
      cache: 'no-cache, no-store, must-revalidate',
      meta: {
        robots: 'noindex, nofollow, nosnippet, noarchive, noimageindex'
      },
      view: 'user',
      middleware: ensureLoggedIn
    }
  },
  {
    url: '/user/update',
    post: {
      middleware: ensureLoggedIn,
      handler: user.update
    }
  },
  {
    url: '/user/update/username',
    post: {
      middleware: ensureLoggedIn,
      handler: user.updateUsername
    }
  },
  {
    url: '/user/update/picture',
    post: {
      middleware: ensureLoggedIn,
      handler: user.updatePicture
    }
  },
  // Article
  {
    param: 'article',
    handler: article.articleParam
  },
  {
    url: '/article/id/:article',
    get: {
      view: 'article/article',
      handler: article.article
    }
  },
  {
    url: '/article/new',
    get: {
      view: 'article/edit',
      middleware: ensureAdmin,
      handler: article.newGet
    },
    post: {
      middleware: ensureAdmin,
      handler: article.newPost
    }
  },
  {
    url: '/article/edit/:article',
    get: {
      view: 'article/edit',
      middleware: ensureAdmin,
      handler: article.editGet
    }
  },
  {
    url: '/article/edit',
    post: {
      middleware: ensureAdmin,
      handler: article.editPost
    }
  },
  {
    url: '/article/delete/:article',
    get: {
      view: 'article/delete',
      middleware: ensureAdmin,
      cache: 'no-cache, no-store, must-revalidate',
      handler: article.deleteGet
    }
  },
  {
    url: '/article/delete',
    post: {
      middleware: ensureAdmin,
      handler: article.deletePost
    }
  },
  // Archive
  {
    url: '/archive(/:page-:count)?',
    get: {
      view: 'archive',
      handler: archive.getArchive
    }
  },
  // About
  {
    url: '/about',
    get: {
      view: 'about/about',
      handler: about.get
    }
  },
  {
    url: '/about/new',
    get: {
      view: 'about/edit',
      middleware: ensureAdmin,
      handler: about.newGet
    },
    post: {
      middleware: ensureAdmin,
      handler: about.newPost
    }
  },
  {
    url: '/about/edit/:id',
    get: {
      view: 'about/edit',
      middleware: ensureAdmin,
      handler: about.editGet
    }
  },
  {
    url: '/about/edit',
    post: {
      middleware: ensureAdmin,
      handler: about.editPost
    }
  },
  {
    url: '/about/delete/:id',
    get: {
      view: 'about/delete',
      middleware: ensureAdmin,
      handler: about.deleteGet
    }
  },
  {
    url: '/about/delete',
    post: {
      middleware: ensureAdmin,
      handler: about.deletePost
    }
  },
  // Admin
  {
    url: '/admin(/dashboard)?',
    get: {
      meta: {
        robots: 'noindex, nofollow, nosnippet, noarchive, noimageindex'
      },
      view: 'admin/dashboard',
      middleware: admin.adminAreaMiddleware
    }
  },
  {
    url: '/admin/statistics',
    get: {
      meta: {
        robots: 'noindex, nofollow, nosnippet, noarchive, noimageindex'
      },
      view: 'admin/statistics',
      middleware: admin.adminAreaMiddleware
    }
  },
  {
    url: '/admin/managearticles',
    get: {
      meta: {
        robots: 'noindex, nofollow, nosnippet, noarchive, noimageindex'
      },
      view: 'admin/manageArticles',
      middleware: admin.adminAreaMiddleware,
      handler: admin.manageArticlesGet
    }
  },
  // API
  {
    url: '/api/public-state',
    post: {
      middleware: ensureAdmin,
      handler: apiArticle.publicStatePost
    }
  },
  {
    url: '/api/upload/image',
    post: {
      middleware: ensureAdmin,
      handler: apiUpload.imagePost
    }
  },
  {
    url: '/api/upload/zip',
    post: {
      middleware: ensureAdmin,
      handler: apiUpload.zipPost
    }
  },
  {
    url: '/api/upload/code',
    post: {
      middleware: ensureAdmin,
      handler: apiUpload.codePost
    }
  },
  {
    url: '/api/upload/audio',
    post: {
      middleware: ensureAdmin,
      handler: apiUpload.audioPost
    }
  }, {
    url: '/api/upload/delete',
    delete: {
      middleware: ensureAdmin,
      handler: apiUpload.deleteDelete
    }
  }
];

const viewCache = {};

function recompileView (view) {
  viewCache[view] = hbsSystem.compile(view);
}

function _compileFromObj (obj) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'object') {
        _compileFromObj(obj[key]);
      } else if (key === 'view') {
        recompileView(obj[key]);
      }
    }
  }
}

function recompileAll () {
  routeDefinitions.forEach(_compileFromObj);
}

function createViewMw (routeDef) {
  const view = routeDef.view;
  if (!viewCache[view]) {
    viewCache[view] = hbsSystem.compile(view);
  }
  return function (req, res, next) {
    if (routeDef.cache) {
      res.set('Cache-Control', routeDef.cache);
    }
    req.meta = Object.assign({}, routeDef.meta);
    req.template = viewCache[view];
    next();
  };
}

for (const def of routeDefinitions) {
  for (const key in def) {
    if (def.hasOwnProperty(key) && router[key] && def.url) {
      const mw = [];
      if (def[key].middleware) {
        if (Array.isArray(def[key].middleware)) {
          for (const func of def[key].middleware) {
            mw.push(func);
          }
        } else {
          mw.push(def[key].middleware);
        }
      }
      if (def[key].view) {
        mw.push(createViewMw(def[key]));
      }
      if (def[key].handler) {
        if (Array.isArray(def[key].handler)) {
          // In case the handler is an array of functions
          router[key](def.url, mw.concat(def[key].handler), (req, res, next) => next());
        } else {
          router[key](def.url, mw, def[key].handler);
        }
      } else {
        router[key](def.url, mw, (req, res, next) => next());
      }
    } else if (def.param && key === 'param') {
      router.param(def.param, def.handler);
    }
  }
}

module.exports = {
  router,
  recompileAll,
  routeDefinitions
};
