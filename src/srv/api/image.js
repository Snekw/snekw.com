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
const models = require('../../db/models.js');
const ensureAdmin = require('../../lib/ensureAdmin');
const upload = require('../../lib/api/upload');

router.post('/new', ensureAdmin, upload.image('image'), function (req, res, next) {
  if (!req.snw || !req.snw.image) {
    return res.status(400).json({
      err: {
        id: 'ERR_FILE_REJECTED',
        message: 'File rejected.'
      }
    });
  }
  req.snw.image.save((err) => {
    if (err) {
      return next(err);
    }
    let ret = {
      data: {
        path: req.snw.image.path,
        size: req.snw.image.size
      }
    };
    if (req.snw.image.info) {
      ret.data.info = {
        title: req.snw.image.info.title,
        alt: req.snw.image.info.alt
      };
    }
    return res.status(200).json(ret);
  });
});

module.exports = router;
