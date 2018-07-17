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
const cssInternal = require('./css');
const utility = require('../../src/helpers/fs-utility');

const scssReader = utility.readFileGenerator('./src/scss', '.scss');
const thirdPartyCssReader = utility.readFileGenerator('./src/static/css/third-party', '.css');
const compileScss = cssInternal.compileScssGenerator('expanded', ['./src/scss']);
const saveCss = utility.saveFileGenerator('./dist/static/css', '.min.css');
const logger = require('./logger');

function processScssFile (fileName) {
  logger(`Processing scss: ${fileName}`);
  return scssReader(fileName)
    .then(compileScss)
    .then(cssInternal.prefixCss)
    .then(cssInternal.cleanCss)
    .then(saveCss(fileName));
}

module.exports = function () {
  return Promise.all([
    processScssFile('mdEditor'),
    processScssFile('admin'),
    processScssFile('main'),
    thirdPartyCssReader('prism')
      .then(cssInternal.prefixCss)
      .then(cssInternal.cleanCss)
      .then(saveCss('prism', 'third-party'))
  ]);
};
