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

const form = document.getElementById('upload');
const submit = document.getElementById('upl_submit');
const progress = document.getElementById('upl_progress');

form.addEventListener('submit', processForm);

function processForm (e) {
  e.preventDefault();
  const formData = new FormData(form);

  if (document.getElementById('upl_image').files.length < 1) {
    return;
  }

  submit.disabled = true;
  let uploadEndPoint = 'image';

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

  let fData = {};
  formData.forEach(function (value, key) {
    if (key !== '_csrf') {
      fData[key] = value;
    }
  });
  ajaxRequest('POST', '/api/upload/' + uploadEndPoint,
    {
      _csrf: formData.get('_csrf'),
      progress: progress,
      form: true
    },
    formData)
    .then(function (resp) {
      submit.disabled = false;
      addToAvailable(resp.data);
    })
    .catch(function (err) {
      submit.disabled = false;
      console.log(err);
    });
  return false;
}
