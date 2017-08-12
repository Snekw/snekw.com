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
const autoprefixer = require('autoprefixer');
const postcss = require('postcss');
const sass = require('node-sass');
const fs = require('fs');
const CleanCss = require('clean-css');
const fsExt = require('fs-extra');
const path = require('path');
const rimraf = require('rimraf');

function compileScss (file, style) {
  return new Promise((resolve, reject) => {
    sass.render({
      style: style || 'expanded',
      file: './src/scss/' + file + '.scss'
    }, (err, out) => {
      if (err) {
        reject(err);
      } else {
        resolve({file: file, out: out});
      }
    });
  });
}

function prefixCss (input) {
  return new Promise((resolve, reject) => {
    postcss([autoprefixer]).process(input.out.css).then((out) => {
      input.out = out;
      return resolve(input);
    }).catch(err => {
      return reject(err);
    });
  });
}

function cleanCss (input) {
  return new Promise((resolve, reject) => {
    new CleanCss({returnPromise: true}).minify(input.out.css).then(out => {
      input.out = out;
      return resolve(input);
    }).catch(err => {
      return reject(err);
    });
  });
}

function saveCssMin (input) {
  return new Promise((resolve, reject) => {
    fsExt.ensureDir('./dist/static', err => {
      if (err) {
        return reject(err);
      }
      fs.writeFile('./dist/static/' + input.file + '.min.css', input.out.styles, err => {
        if (err) {
          return reject(err);
        } else {
          return resolve('./dist/static/' + input.file + '.min.css written.');
        }
      });
    });
  });
}

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

function clean () {
  rimraf.sync('./dist');
}

clean();

const files = [
  copyFile('./src/config/mainConfig.js', './dist/config/mainConfig.js'),
  copyFile('./src/static/favicon.ico', './dist/static/favicon.ico'),
  copyFile('./node_modules/prismjs/prism.js', './dist/static/prism.js'),
  copyFile('./node_modules/prismjs/themes/prism-okaidia.css', './dist/static/prism-okaidia.css'),
  copyFile('./src/static/mdEditor.js', './dist/static/mdEditor.js')
];

const dirs = [
  copyDir('./src/db', './dist/db'),
  copyDir('./src/helpers', './dist/helpers'),
  copyDir('./src/lib', './dist/lib'),
  copyDir('./src/helpers', './dist/helpers'),
  copyDir('./src/srv', './dist/srv'),
  copyDir('./src/views', './dist/views')
];

compileScss('main')
  .then(prefixCss)
  .then(cleanCss)
  .then(saveCssMin)
  .then(out => {
    console.log(out);
  })
  .catch(err => {
    console.log(err);
  });
compileScss('mdEditor')
  .then(prefixCss)
  .then(cleanCss)
  .then(saveCssMin)
  .then(out => {
    console.log(out);
  })
  .catch(err => {
    console.log(err);
  });

let all = files.concat(dirs);
Promise.all(all)
  .then(() => {
    console.log('Files copied');
  })
  .catch(err => {
    console.log(err);
  });
