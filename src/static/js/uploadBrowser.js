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

var attachedUploads = document.getElementById('attached-uploads-target');
var availableUploads = document.getElementById('available-uploads-target');
var template = document.getElementById('upload-template');

function fillTemplate (image) {
  var imgPath;
  switch (image.type){
    case 'zip':
      imgPath = '/static/uploads/images/rklJd-QAz.png';
      break;
    case 'audio':
      imgPath = '/static/uploads/images/rklJd-QAz.png';
      break;
    case 'code':
      imgPath = '/static/uploads/images/rklJd-QAz.png';
      break;
    case 'img':
      imgPath = image.path;
      break;
    default:
      // Upload type that doesn't have a default image
      imgPath = '/static/uploads/images/rklJd-QAz.png';
  }
  template.content.querySelector('img').src = imgPath;
  template.content.querySelector('span[data-title]').innerText = image.info.title;
  template.content.querySelector('span[data-size]').innerText = image.size;
  return document.importNode(template.content, true);
}

function addToAttached (image) {
  attachedUploads.appendChild(fillTemplate(image));
}

function addToAvailable (image) {
  availableUploads.appendChild(fillTemplate(image));
}