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

/***
 * Make a AJAX request
 * @param method HTTP method to use
 * @param url API url
 * @param options Options for progress bar and _csrf
 * @param data Data to send
 * @returns {Promise<any>}
 */
export function ajaxRequest (method, url, options, data) {
  return new Promise(function (resolve, reject) {
    let x = new XMLHttpRequest();

    if (options && options.progress) {
      options.progress.value = 0;
      options.progress.max = 1;
      x.onprogress = function (ev) {
        if (ev.lengthComputable) {
          options.progress.value = ev.loaded / ev.total;
        } else {
          options.progress.value = null;
        }
      };
    }

    x.onload = function (ev) {
      try {
        const data = JSON.parse(ev.target.responseText);
        return resolve({request: ev, data: data});
      } catch (e) {
        return reject(e);
      }
    };

    x.onerror = function (ev) {
      return reject(ev);
    };

    x.onabort = function (ev) {
      return reject(ev);
    };

    x.open(method, url, true);
    if (options && options._csrf) {
      x.setRequestHeader('csrf-token', options._csrf);
    }
    if (options.form === true) {
      x.send(data);
    } else {
      x.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
      x.send(JSON.stringify(data));
    }
  });
}
