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
const fs = require('fs');
const fsExt = require('fs-extra');
const path = require('path');

function copyFile (source, target) {
  return new Promise((resolve, reject) => {
    fsExt.ensureDir(path.dirname(target), err => {
      if (err && err.code !== 'EEXIST') {
        return reject(err);
      }

      let rd = fs.createReadStream(source);
      rd.on('error', function (err) {
        return reject(err);
      });
      let wr = fs.createWriteStream(target);
      wr.on('error', function (err) {
        return reject(err);
      });
      wr.on('close', function (ex) {
        return resolve();
      });
      rd.pipe(wr);
    });
  });
}

copyFile('./src/config/mainConfigDev.js', './dist/config/mainConfigDev.js');
