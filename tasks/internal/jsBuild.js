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
const utility = require('../../src/helpers/fs-utility');
const logger = require('./logger');
const babel = require('babel-core');
const rollup = require('rollup');
const rollupResolve = require('rollup-plugin-node-resolve');
const rollupCommonjs = require('rollup-plugin-commonjs');
const UglifyJs = require('uglify-js');

const jsSourceLocation = './src/clientJs';
let bundleSaver;

function rollupBundle (input) {
  return new Promise((resolve, reject) => {
    const name = /(?:\/|\\)(\w+)\.js$/g.exec(input)[1];
    rollup.rollup({
      input: input,
      plugins: [
        rollupResolve(),
        rollupCommonjs()
      ]
    })
      .then(bundle => bundle.generate({
        format: 'cjs',
        name: name
      }))
      .then(d => {
        logger(`Bundle created: ${name}`);
        return resolve(d.code);
      })
      .catch(err => {
        logger(`Failed to create bundle: ${input}`);
        return reject(err);
      });
  });
}

function transpile (input) {
  const result = babel.transform(input, {
    presets: 'env'
  });
  logger('Transpiled');
  return result.code;
}

function uglify (input) {
  const result = UglifyJs.minify(input, {
    compress: {
      drop_console: true
    },
    output: {
      comments: 'some'
    }
  });
  logger('Uglified');
  return result.code;
}

const jsBundles = fs.readdirSync(jsSourceLocation)
  .filter(item => item.includes('Bundle.js'))
  .map(item => ([
    path.resolve(path.join(jsSourceLocation, item)),
    item.replace(path.extname(item), '')
  ]));

const thirdParty = [
  ['./node_modules/prismjs', 'prism', '.js']
];

module.exports = (mode) => {
  const bundleSaver = utility.saveFileGenerator(path.resolve(path.join(mode, 'static', 'js')),
    '.min.js');
  const libSaver = utility.saveFileGenerator(
    path.resolve(path.join(mode, 'static', 'js', 'third-party')), '.min.js');

  const tasks = jsBundles.map(bundle =>
    rollupBundle(bundle[0])
      .then(transpile)
      .then(uglify)
      .then(bundleSaver(bundle[1]))
  );
  tasks.push(thirdParty.map(lib =>
    utility.readFile(lib[0], lib[1], lib[2])
      .then(transpile)
      .then(uglify)
      .then(libSaver(lib[1]))
  ));
  return Promise.all(tasks);
};
