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

const zipMimes = [
  'application/zip',
  'application/x-rar-compressed'
];

const codeMimes = [
  'text/plain'
];

const audioMimes = [
  'audio/midi',
  'audio/mpeg',
  'audio/webm',
  'audio/ogg',
  'audio/wav'
];

function checkUploadFields (req) {
  let errs = [];
  if (!req.body.type) {
    errs.push('NO TYPE');
  }
  if (!req.body.alt) {
    errs.push('NO ALT');
  }
  if (!req.body.title) {
    errs.push('NO TITLE');
  }
  if (!req.body.description) {
    errs.push('NO DESCRIPTION');
  }

  return errs;
}

function createFilter (mimes) {
  return function (req, file, cb) {
    let errs = checkUploadFields(req);
    if (errs.length > 0) {
      return cb(errs);
    }

    if (mimes.indexOf(file.mimetype) > -1) {
      return cb(null, true);
    }
    return cb(null, false);
  };
}

function createStorage (dest, filenamegen) {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      fsExt.ensureDir(dest);
      return cb(null, dest);
    },
    filename: function (req, file, cb) {
      return cb(null, filenamegen(file));
    }
  });
}

function imgFilenameGen (file) {
  return shortId.generate() + path.extname(file.originalname);
}

function zipFilenameGen (file) {
  return shortId.generate() + file.originalname;
}

const imgUpload = multer({
  storage: createStorage('./static/uploads/images', imgFilenameGen),
  fileFilter: createFilter(imageMimes)
});

const zipUpload = multer({
  storage: createStorage('./static/uploads/zip', zipFilenameGen),
  fileFilter: createFilter(zipMimes)
});

const codeUpload = multer({
  storage: createStorage('./static/uploads/code', zipFilenameGen),
  fileFilter: createFilter(codeMimes)
});

const audioUpload = multer({
  storage: createStorage('./static/uploads/audio', zipFilenameGen),
  fileFilter: createFilter(audioMimes)
});

/**
 * Image upload middleware
 * @param field - Field name
 * @returns {Function} - Adds upload info to req.snw.image
 */
function image (field) {
  return function (req, res, next) {
    let up = imgUpload.single(field);
    up(req, res, function (err) {
      uploadCallback(err, req, res, next);
    });
  };
}

function zip (field) {
  return function (req, res, next) {
    let up = zipUpload.array(field);
    up(req, res, function (err) {
      uploadCallback(err, req, res, next);
    });
  };
}

function code (field) {
  return function (req, res, next) {
    let up = codeUpload.array(field);
    up(req, res, function (err) {
      uploadCallback(err, req, res, next);
    });
  };
}

function audio (field) {
  return function (req, res, next) {
    let up = audioUpload.array(field);
    up(req, res, function (err) {
      uploadCallback(err, req, res, next);
    });
  };
}

function uploadCallback (err, req, res, next) {
  if (err) {
    return next(err);
  }
  if (!req.file) {
    return next();
  }
  req.snw = req.snw || {};
  // eslint-disable-next-line new-cap
  req.snw.upload = new models.upload({
    name: req.file.filename,
    mimeType: req.file.mimetype,
    path: req.file.path,
    size: req.file.size,
    encoding: req.file.encoding,
    type: req.body.type,
    info: {
      title: req.body.title,
      alt: req.body.alt,
      description: req.body.description
    }
  });
  return next();
}

module.exports = {
  image,
  zip,
  code,
  audio
};
