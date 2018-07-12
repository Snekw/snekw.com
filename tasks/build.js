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
const path = require('path');
const css = require('css');
// const uglifyJS = require('uglify-es');
const utility = require('../src/helpers/fs-utility');

// Build functions

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
    utility.ensureDir('./dist/static/css/third-party', err => {
      if (err) {
        return reject(err);
      }
      fs.writeFile('./dist/static/css/' + input.file + '.css', input.out.styles, err => {
        if (err) {
          return reject(err);
        } else {
          return resolve('./dist/static/css/' + input.file + '.css written.');
        }
      });
    });
  });
}

function getFoldCss (input) {
  return new Promise((resolve, reject) => {
    fs.readFile('./src/views/partials/layout.hbs', 'utf8', (err, data) => {
      if (err) {
        return reject(err);
      }
      let cssContent = css.parse(input.out.css.toString());
      let start = data.indexOf('{{!@#') + 7; // Trim the comment syntax out
      let end = data.indexOf('#@}}');
      let content = data.substr(start, end - start).split(/[\n]|,/);
      content = content.map((val) => {
        return val.trim();
      });

      let foldCssAST = {
        parent: null,
        stylesheet: {
          rules: [],
          parsingErrors: []
        },
        type: 'stylesheet'
      };
      let addedRuleIndices = [];
      for (let i = 0; i < content.length; i++) {
        for (let d = 0; d < cssContent.stylesheet.rules.length; d++) {
          let rule = cssContent.stylesheet.rules[d];
          if (rule.type !== 'rule') {
            continue;
          }
          for (let x = 0; x < rule.selectors.length; x++) {
            if (content[i] === rule.selectors[x]) {
              if (addedRuleIndices.indexOf(d) > -1) {
                continue;
              }
              addedRuleIndices.push(d);
              foldCssAST.stylesheet.rules.push(rule);
            }
          }
        }
      }

      let foldCss = css.stringify(foldCssAST);
      new CleanCss({returnPromise: true}).minify(foldCss).then(out => {
        let newData = data.slice(0, start - 7);
        newData += '<style>' + out.styles + '</style>';
        newData += data.slice(end + 4, data.length);
        fs.writeFile('./dist/views/partials/layout.hbs', newData, {}, (err) => {
          if (err) {
            return reject(err);
          }
          return resolve(input);
        });
      }).catch(err => {
        return reject(err);
      });
    });
  });
}

function uglify (filePath, destPath) {
  let code = fs.readFileSync(filePath).toString();
  // let result = uglifyJS.minify(code, {
  //   compress: {
  //     drop_console: true
  //   },
  //   output: {
  //     comments: 'some'
  //   }
  // });
  // if (result.error) throw result.error;
  utility.ensureDir(path.dirname(destPath), err => {
    if (err) {
      throw err;
    }
    // fs.writeFileSync(destPath, result.code);
    fs.writeFileSync(destPath, code);
  });
}

// Start of actual build

// Save the previously used config file
let previousConfig;
let prevConfigPath = './dist/config/mainConfig.js';
if (fs.existsSync(prevConfigPath)) {
  previousConfig = fs.readFileSync(prevConfigPath);
}

utility.clean('./dist');

const files = [
  utility.copyFile('./src/package.json', './dist/package.json'),
  utility.copyFile('./src/package-lock.json', './dist/package-lock.json'),
  utility.copyFile('./src/config-example/mainConfig.js', './dist/config/mainConfig.js'),
  utility.copyFile('./src/static/favicon.ico', './dist/static/favicon.ico'),
  utility.copyFile('./src/static/favicon.png', './dist/static/favicon.png'),
  utility.copyFile('./node_modules/commonmark/dist/commonmark.min.js',
    './dist/static/js/third-party/commonmark.min.js')
];

const dirs = [
  utility.copyDir('./src/db', './dist/db'),
  utility.copyDir('./src/helpers', './dist/helpers'),
  utility.copyDir('./src/lib', './dist/lib'),
  utility.copyDir('./src/helpers', './dist/helpers'),
  utility.copyDir('./src/srv', './dist/srv'),
  utility.copyDir('./src/views', './dist/views'),
  utility.copyDir('./src/static/images', './dist/static/images')
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

compileScss('admin')
  .then(prefixCss)
  .then(cleanCss)
  .then(saveCssMin)
  .then(out => {
    console.log(out);
  })
  .catch(err => {
    console.log(err);
  });

prefixCss({
  file: 'third-party/prism',
  out: {
    css: fs.readFileSync('./src/static/css/third-party/prism.css')
  }
})
  .then(cleanCss)
  .then(saveCssMin)
  .then(out => {
    console.log(out);
  });

let all = files.concat(dirs);
Promise.all(all)
  .then(() => {
    console.log('Files copied');

    if (previousConfig) {
      fs.writeFileSync(prevConfigPath, previousConfig);
      console.log('Config file restored.');
    }
  })
  .catch(err => {
    console.log(err);
  });

uglify('./node_modules/prismjs/prism.js', './dist/static/js/third-party/prism.min.js');
uglify('./src/static/js/mdEditor.js', './dist/static/js/mdEditor.js');
uglify('./src/static/js/admin.js', './dist/static/js/admin.js');
uglify('./src/static/js/upload.js', './dist/static/js/upload.js');
uglify('./src/static/js/uploadBrowser.js', './dist/static/js/uploadBrowser.js');
