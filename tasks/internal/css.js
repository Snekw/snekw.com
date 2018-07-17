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
const autoprefixer = require('autoprefixer');
const postcss = require('postcss');
const sass = require('node-sass');
const CleanCss = require('clean-css');

function compileScssGenerator (style, includePaths) {
  return (data) => {
    return new Promise((resolve, reject) => {
      sass.render({
        style: style || 'expanded',
        data,
        includePaths
      }, (err, out) => {
        if (err) {
          reject(err);
        } else {
          resolve(out.css);
        }
      });
    });
  };
}

function prefixCss (data) {
  return new Promise((resolve, reject) => {
    postcss([autoprefixer]).process(data, {from: undefined}).then((out) => {
      out.warnings().forEach(function (warn) {
        console.warn(warn.toString());
      });
      return resolve(out.css);
    }).catch(err => {
      return reject(err);
    });
  });
}

function cleanCss (data) {
  return new Promise((resolve, reject) => {
    new CleanCss({returnPromise: true}).minify(data).then(out => {
      return resolve(out.styles);
    }).catch(err => {
      return reject(err);
    });
  });
}

module.exports = {
  compileScssGenerator,
  prefixCss,
  cleanCss
};
