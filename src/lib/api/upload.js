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
const utility = require('../../helpers/fs-utility');
const models = require('../../db/models');
const errors = require('../../srv/ErrorJSONAPI');

const imageMimes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp'
];

const zipMimes = [
  'application/zip',
  'application/x-rar-compressed',
  'application/x-zip-compressed',
  'application/octet-stream'
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
    errs.push('type');
  }
  if (!req.body.alt) {
    errs.push('alt');
  }
  if (!req.body.title) {
    errs.push('title');
  }
  if (!req.body.description) {
    errs.push('description');
  }

  return errs;
}

function createFilter (mimes) {
  return function (req, file, cb) {
    let errs = checkUploadFields(req);
    if (errs.length > 0) {
      return cb(new errors.ErrorMissingParameters(errs));
    }

    if (mimes.indexOf(file.mimetype) > -1) {
      return cb(null, true);
    }
    return cb(new errors.ErrorUploadMimeType(file.mimetype));
  };
}

function createStorage (dest, filenamegen) {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      utility.ensureDir(dest, err => {
        if (err) {
          return cb(err);
        } else {
          return cb(null, dest);
        }
      });
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
  return shortId.generate() + '--' + file.originalname;
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
    let up = imgUpload.array(field);
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

function createUploadModel (file, body) {
  // eslint-disable-next-line new-cap
  return new models.upload({
    name: file.filename,
    mimeType: file.mimetype,
    path: file.path,
    size: file.size,
    encoding: file.encoding,
    type: body.type,
    info: {
      title: body.title,
      alt: body.alt,
      description: body.description
    }
  });
}

function uploadCallback (err, req, res, next) {
  if (err) {
    return next(new errors.ErrorUploadRejected(err));
  }
  if (!req.file && !req.files) {
    return next(new errors.ErrorUploadRejected());
  }
  req.snw = req.snw || {};
  if (req.file) {
    req.snw.upload = createUploadModel(req.file, req.body);
  } else if (req.files) {
    if (req.files.length === 1) {
      req.snw.upload = createUploadModel(req.files[0], req.body);
    } else {
      let files = [];
      for (let i = 0; i < req.files.length; i++) {
        files.push(createUploadModel(req.files[i], req.body));
      }
      req.snw.upload = files;
    }
  }
  return next();
}

module.exports = {
  image,
  zip,
  code,
  audio
};
