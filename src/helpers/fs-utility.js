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
const fs = require('fs');
const path = require('path');

/**
 * Ensure that a directory exists
 * @param dir Path to a directory
 * @param cb Callback
 * @returns {*} Error code or null
 */
function ensureDir (dir, cb) {
  let normalizedPath = path.normalize(path.resolve(dir));
  let split = normalizedPath.split(path.sep);
  let parsed = path.parse(normalizedPath);

  // Set the root to be the base string
  let ensuredPath = parsed.root;
  for (let i = 1; i < split.length; i++) {
    ensuredPath = path.join(ensuredPath, split[i]);

    // Ensure the directory exists
    if (!fs.existsSync(ensuredPath)) {
      try {
        fs.mkdirSync(ensuredPath);
      } catch (err) {
        if (err.code !== 'EEXIST') {
          return cb(err);
        }
      }
    }
  }
  return cb(null);
}

/**
 * Delete a directory.
 * @param dir Path to the directory
 */
function clean (dir) {
  let normalizedPath = path.normalize(path.resolve(dir));
  let parsed = path.parse(normalizedPath);

  // Don't try to delete root
  if (parsed.root === normalizedPath) {
    return;
  }

  if (fs.existsSync(normalizedPath)) {
    fs.readdirSync(normalizedPath).forEach(entry => {
      let entryPath = path.join(normalizedPath, entry);
      if (fs.lstatSync(entryPath).isDirectory()) {
        clean(entryPath);
      } else {
        fs.unlinkSync(entryPath);
      }
    });
    fs.rmdirSync(normalizedPath);
  }
}

/**
 * Create a copy of a file.
 * @param source Path to the file to be copied.
 * @param target Path to where to copy the file.
 * @returns {Promise<any>} Error code or null.
 */
function copyFile (source, target) {
  return new Promise((resolve, reject) => {
    ensureDir(path.dirname(target), err => {
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

/**
 * Create a copy of a directory
 * @param source Path to the directory to copy.
 * @param target Path to the destination directory.
 * @returns {Promise<any>} Error code or null.
 */
function copyDir (source, target) {
  return new Promise((resolve, reject) => {
    let promises = [];
    fs.readdir(source, (err, items) => {
      if (err) {
        return reject(err);
      }
      for (let i = 0; i < items.length; i++) {
        let stat = fs.statSync(path.join(source, items[i]));
        if (stat.isFile()) {
          promises.push(copyFile(path.join(source, items[i]), path.join(target, items[i])));
        } else if (stat.isDirectory()) {
          promises.push(copyDir(path.join(source, items[i]), path.join(target, items[i])));
        }
      }
      Promise.all(promises).then(() => {
        return resolve();
      }).catch(err => {
        return reject(err);
      });
    });
  });
}

module.exports = {
  ensureDir,
  clean,
  copyFile,
  copyDir
};