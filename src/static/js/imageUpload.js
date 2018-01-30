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

document.getElementById('img-upload').addEventListener('submit', processForm);
var uplImage = document.getElementById('upl_image');

function processForm (e) {
  e.preventDefault();
  var formData = new FormData();
  formData.append('title', 'test');
  formData.append('alt', 'test');
  formData.append('image', uplImage.files[0]);

  var x = new XMLHttpRequest();
  x.open('POST', '/api/upload/image/new', true);
  x.send(formData);
  console.log(e);
  return false;
}
