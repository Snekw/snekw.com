/** @preserve
 *  @licence
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

document.getElementById('admin-nav-toggle').addEventListener('click', doAdminNavToggle);

var nav = document.getElementById('admin-nav-container');
var adminNavKey = 'admin-nav';
var toggleClass = 'toggle-hide';

function updateNavState () {
  if (JSON.parse(window.localStorage.getItem(adminNavKey)) === false) {
    nav.classList.remove(toggleClass);
  } else {
    nav.classList.add(toggleClass);
  }
}

function doAdminNavToggle (e) {
  window.localStorage.setItem(adminNavKey, !JSON.parse(window.localStorage.getItem(adminNavKey)));
  updateNavState();
  if (e) {
    e.preventDefault();
  }
}

updateNavState();
