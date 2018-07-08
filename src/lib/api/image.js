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
const {promisify} = require('util');
const sizeOfImage = promisify(require('image-size'));
const sharp = require('sharp');
const errors = require('../../srv/ErrorJSONAPI');

const generatedSizes = [2560, 1920, 1680, 1280, 720, 480];

function createAltImages (imagePath) {
  if (!imagePath) return;
  sizeOfImage(imagePath)
    .then(dimensions => {
      const sizesToGenerate = generatedSizes.filter(w => dimensions.width > w);
      const aspectRatio = dimensions.width / dimensions.height;
      const inputBuffer = fs.readFileSync(imagePath);
      const extension = path.extname(imagePath);
      return Promise.all(sizesToGenerate.map(size => {
        return sharp(inputBuffer)
          .resize(size, Math.trunc(size / aspectRatio + 0.5))
          .toFile(`${imagePath.replace(extension, '')}_w${size}${extension}`);
      }));
    });
}

function optimizeSrcImage (imagePath) {
  if (!imagePath) return;
  if (path.extname(imagePath) === '.png') return;
  sizeOfImage(imagePath)
    .then(dimensions => {
      const inputBuffer = fs.readFileSync(imagePath);
      return sharp(inputBuffer)
        .resize(dimensions.width, dimensions.height)
        .toFile(imagePath);
    });
}

function generateThumbnail (imagePath) {
  if (!imagePath) return;
  sizeOfImage(imagePath)
    .then(dimensions => {
      const inputBuffer = fs.readFileSync(imagePath);
      const aspectRatio = dimensions.width / dimensions.height;
      return sharp(inputBuffer)
        .resize(40, Math.trunc(40 / aspectRatio + 0.5))
        .toFile(getThumbnailPath(imagePath));
    });
}

function getAltImageNames (imagePath) {
  if (!imagePath) return [];
  const extension = path.extname(imagePath);
  return generatedSizes
    .map(size => `${imagePath.replace(extension, '')}_w${size}${extension}`)
    .filter((p) => fs.existsSync(p));
}

function processFileList (files) {
  const tasks = files.map((file) => createAltImages(file.path || file));
  tasks.concat(files.map((file) => optimizeSrcImage(file.path || file)));
  tasks.concat(files.map((file) => generateThumbnail(file.path || file)));
  return Promise.all(tasks);
}

function processImagesMD (req, res, next) {
  if (!req.files) {
    return next(new errors.ErrorMissing('file'));
  }
  processFileList(req.files)
    .then(() => next())
    .catch((err) => next(err));
}

function fixPath (path) {
  return '/' + path.replace(/\\/g, '/');
}

function getThumbnailPath (imagePath) {
  const ext = path.extname(imagePath);
  return `${imagePath.replace(ext, '')}_thumb${ext}`;
}

function isGenerated (img) {
  const match = /(?:_w)(\d+)\.\w+$/gi.exec(img);
  if (!match || match.length !== 2) return false;
  return match[1];
}

module.exports = {
  createAltImages,
  getAltImageNames,
  optimizeSrcImage,
  processImagesMD,
  fixPath,
  generateThumbnail,
  getThumbnailPath,
  processFileList,
  isGenerated
};
