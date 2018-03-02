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

var form = document.getElementById('upload');
var submit = document.getElementById('upl_submit');
var progress = document.getElementById('upl_progress');

form.addEventListener('submit', processForm);

function processForm (e) {
  e.preventDefault();
  var formData = new FormData(form);

  if (document.getElementById('upl_image').files.length < 1) {
    return;
  }

  submit.disabled = true;
  var x = new XMLHttpRequest();
  var uploadEndPoint = 'image';

  switch (formData.get('type')) {
    case 'image':
      uploadEndPoint = 'image';
      break;
    case 'zip':
      uploadEndPoint = 'zip';
      break;
    case 'code':
      uploadEndPoint = 'code';
      break;
    case 'audio':
      uploadEndPoint = 'audio';
      break;
    default:
      uploadEndPoint = 'image';
  }

  x.onload = function (ev) {
    submit.disabled = false;
  };

  x.upload.addEventListener('progress', function (ev) {
    if (ev.lengthComputable) {
      progress.value = ev.loaded / ev.total;
    }
  }, false);

  x.open('POST', '/api/upload/' + uploadEndPoint, true);
  x.setRequestHeader('csrf-token', formData.get('_csrf'));
  x.send(formData);
  progress.value = 0;
  return false;
}
