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
const multer = require('multer');
const models = require('../../db/models.js');
const ensureAdmin = require('../../lib/ensureAdmin');
const shortId = require('shortid');
const path = require('path');

const storage = multer.diskStorage({
  destination: './static/images',
  filename: function (req, file, cb) {
    cb(null, shortId.generate() + path.extname(file.originalname));
  }
});

const upload = multer({storage: storage});

router.post('/new', ensureAdmin, upload.single('image'), function (req, res, next) {
  res.status(501).json({});
});

module.exports = router;
