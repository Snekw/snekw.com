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

const storage = multer.diskStorage({
  destination: './static/uploads',
  filename: function (req, file, cb) {
    cb(null, shortId.generate() + path.extname(file.originalname));
  }
});

const upload = multer({storage: storage});

function image (field) {
  return image[field] || (image[field] = [function (req, res, next) {
  }]);
}

module.exports = {
  image
};
