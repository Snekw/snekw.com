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
const utility = require('../../src/helpers/fs-utility');

const filesDifOutput = [
  [
    './node_modules/commonmark/dist/commonmark.min.js',
    './dist/static/js/third-party/commonmark.min.js'
  ]
];

const files = [
  './src/package.json',
  './src/package-lock.json',
  './src/config-example/mainConfig.js',
  './src/static/favicon.ico'
];

const dirs = [
  './src/db',
  './src/helpers',
  './src/lib',
  './src/helpers',
  './src/srv',
  './src/views',
  './src/static/images',
  './src/upgradeScripts'
];

function replaceSrcWithDist (input) {
  return input.replace(/^\.\/src/g, './dist');
}

module.exports = () => {
  const copyDirs = dirs.map(dir => utility.copyDir(dir, replaceSrcWithDist(dir)));
  const copyFiles = files.map(file => utility.copyFile(file, replaceSrcWithDist(file)));
  const copyFilesDifOutput = filesDifOutput.map(file => utility.copyFile(file[0], file[1]));

  return Promise.all([
    copyDirs,
    copyFiles,
    copyFilesDifOutput
  ]);
};
