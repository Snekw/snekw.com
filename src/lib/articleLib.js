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
const config = require('../helpers/configStub')('main');
const models = require('../db/models');
const imageLib = require('./api/image');

function createTitle (title) {
  return !title ? config.siteName : title + ' - ' + config.siteName;
}

function getSiteMapInfo (articleId) {
  return Promise.all([
    models.article.findById(articleId).lean().exec(),
    models.upload.find({articles: articleId}).exec()
  ])
    .then(data => {
      const article = data[0];
      const uploads = data[1];
      if (!article) {
        return Promise.reject(new Error('Missing article'));
      }
      const ret = {
        url: `/article/id/${article._id}`
      };
      if (uploads.length > 0) {
        ret.img = uploads.map(v => ({
          url: imageLib.fixPath(v.path),
          caption: v.info.alt,
          title: v.info.title
        }));
      }
      return Promise.resolve(ret);
    });
}

module.exports = {
  createTitle,
  getSiteMapInfo
};
