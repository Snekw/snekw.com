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
const ensureAdmin = require('../../lib/ensureAdmin');
const upload = require('../../lib/api/upload');
const image = require('../../lib/api/image');
const errors = require('../ErrorJSONAPI');

function fixPath (path) {
  return '/' + path.replace(/\\/g, '/');
}

function createUploadReturnData (upload) {
  let data = {
    path: fixPath(upload.path),
    size: upload.size,
    type: upload.type,
    id: upload._id
  };
  if (upload.info) {
    data.info = {
      title: upload.info.title,
      description: upload.info.description,
      alt: upload.info.alt
    };
  }
  return data;
}

function uploadResponse (req, res, next) {
  if (!req.snw || !req.snw.upload) {
    return next(new errors.ErrorUploadRejected());
  }
  if (req.snw.upload.length > 1) {
    let errors = [];
    let promises = [];
    for (let i = 0; i < req.snw.upload.length; i++) {
      promises.push(req.snw.upload[i].save());
    }
    Promise.all(promises).then(data => {
      let d = [];
      for (let i = 0; i < data.length; i++) {
        d.push(createUploadReturnData(data[i]));
      }
      return res.status(200).json({data: d});
    }).catch(err => {
      return next(new errors.ErrorDatabaseError(err, 'SAVE'));
    });
  } else {
    req.snw.upload.save((err) => {
      if (err) {
        return next(new errors.ErrorDatabaseError(err, 'SAVE'));
      }
      let data = createUploadReturnData(req.snw.upload);
      return res.status(200).json(data);
    });
  }
}

router.post('/image', ensureAdmin, upload.image('upload'), function (req, res, next) {
  return uploadResponse(req, res, next);
});

router.post('/zip', ensureAdmin, upload.zip('upload'), function (req, res, next) {
  return uploadResponse(req, res, next);
});

router.post('/code', ensureAdmin, upload.code('upload'), function (req, res, next) {
  return uploadResponse(req, res, next);
});

router.post('/audio', ensureAdmin, upload.audio('upload'), function (req, res, next) {
  return uploadResponse(req, res, next);
});

router.delete('/delete', ensureAdmin, function (req, res, next) {
  return res.status(500).json({error: 'Not implemented'});
});

module.exports = router;
