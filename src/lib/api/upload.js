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
const multer = require('multer');
const shortId = require('shortid');
const path = require('path');
const fsExt = require('fs-extra');
const models = require('../../db/models');

const imageMimes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp'
];

function imageFilter (req, file, cb) {
  if (imageMimes.indexOf(file.mimetype) > -1) {
    return cb(null, true);
  }
  return cb(null, false);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dest = './static/uploads/rnd';
    if (imageMimes.indexOf(file.mimetype) > -1) {
      dest = './static/uploads/images';
    }
    fsExt.ensureDir(dest);
    return cb(null, dest);
  },
  filename: function (req, file, cb) {
    if (imageMimes.indexOf(file.mimeType) > -1) {
      return cb(null, shortId.generate() + path.extname(file.originalname));
    }
    return cb(null, shortId.generate() +
      path.basename(file.originalname, path.extname(file.originalname)) +
      path.extname(file.originalname));
  }
});

const imgUpload = multer({storage: storage, fileFilter: imageFilter});

/**
 * Image upload middleware
 * @param field - Field name
 * @returns {Function} - Adds upload info to req.snw.image
 */
function image (field) {
  return function (req, res, next) {
    let u = imgUpload.single(field);
    u(req, res, function (err) {
      if (err) {
        return next(err);
      }
      req.snw = req.snw || {};
      // eslint-disable-next-line new-cap
      req.snw.image = new models.upload({
        name: req.file.filename,
        mimeType: req.file.mimetype,
        path: req.file.path,
        size: req.file.size,
        encoding: req.file.encoding,
        info: {
          title: req.body.title,
          alt: req.body.alt
        }
      });
      return next();
    });
  };
}

module.exports = {
  image
};
