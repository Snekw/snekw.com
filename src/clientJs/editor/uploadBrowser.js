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
import {ajaxRequest} from '../common/request';

let attachedUploads;
let availableUploads;
let template;

function fillTemplate (image) {
  let imgPath;
  switch (image.type) {
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
  template.content.querySelector('div').id = image.id;
  template.content.querySelector('img').src = imgPath;
  template.content.querySelector('span[data-title]').innerText = image.info.title;
  template.content.querySelector('span[data-size]').innerText = image.size;
  template.content.querySelector('button.cpy').dataset.alt = image.info.alt;
  template.content.querySelector('button.cpy').dataset.alt = image.type;
  template.content.querySelector('button.cpy').dataset.path = imgPath.replace(/^\//, '');
  template.content.querySelector('button.del').dataset.title = image.info.title;
  template.content.querySelector('button.del').dataset.id = image.id;
  template.content.querySelector('button.del').dataset.name = imgPath;
  return document.importNode(template.content, true);
}

export function addToAttached (image) {
  attachedUploads.appendChild(fillTemplate(image));
}

export function addToAvailable (image) {
  if (image && image.data) {
    image.data.map(img => availableUploads.appendChild(fillTemplate(img)));
  } else {
    availableUploads.appendChild(fillTemplate(image));
  }
}

function isDescendant (parent, child) {
  let node = child;
  while (node != null) {
    if (node === parent) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
}

function onDrop (ev) {
  ev.preventDefault();
  let data = ev.dataTransfer.getData('text');
  let node = document.getElementById(data);
  if (!node) {
    return;
  }
  let attachedInput = node.querySelector('input[name="attachedUploads[]"]');
  if (isDescendant(attachedUploads, ev.target)) {
    if (!attachedInput) {
      let newInput = document.createElement('input');
      newInput.type = 'hidden';
      newInput.name = 'attachedUploads[]';
      newInput.value = data;
      node.appendChild(newInput);
    }
    attachedUploads.appendChild(node);
  } else {
    if (attachedInput) {
      node.removeChild(attachedInput);
    }
    availableUploads.appendChild(node);
  }
}

function allowDrop (ev) {
  ev.preventDefault();
}

function onDragStart (ev) {
  ev.dataTransfer.setData('text', ev.target.id);
  if (isDescendant(attachedUploads, ev.target)) {
    ev.dataTransfer.setData('source', attachedUploads.id);
  } else {
    ev.dataTransfer.setData('source', availableUploads.id);
  }
}

function onUploadDelete (ev) {
  ev.preventDefault();
  const {id, name, title} = ev.target.dataset;
  let confirmation = confirm('Are you sure you want to delete upload: ' +
    name + ' - ' + title + '?');
  if (!confirmation) {
    return;
  }

  ajaxRequest('DELETE', '/api/upload/delete',
    {_csrf: document.getElementById('upload').querySelector('input[name="_csrf"]').value},
    {id: id})
    .then(function (resp) {
      if (resp.request.target.status !== 200) {
        alert('Failed to delete.');
      } else {
        ev.target.parentElement.parentElement.remove();
      }
    })
    .catch(function (err) {
      console.log(err);
      alert('Failed to delete.');
    });
}

function copyLink (event) {
  event.preventDefault();
  const {path, alt, type} = event.target.dataset;
  const inputField = event.target.parentElement.querySelector('input[type="text"]');
  inputField.value = type === 'img' ? '!' : '';
  inputField.value += '[' + alt + '](/' + path.replace(/\\/g, '/') + ')';
  inputField.select();
  document.execCommand('copy');
}

window.addEventListener('load', () => {
  attachedUploads = document.getElementById('attached-uploads-target');
  availableUploads = document.getElementById('available-uploads-target');
  template = document.getElementById('upload-template');

  attachedUploads.addEventListener('drop', onDrop);
  attachedUploads.addEventListener('dragover', allowDrop);
  availableUploads.addEventListener('drop', onDrop);
  availableUploads.addEventListener('dragover', allowDrop);
});

window.snw = window.snw || {};
window.snw.onDragStart = onDragStart;
window.snw.copyLink = copyLink;
window.snw.onUploadDelete = onUploadDelete;
