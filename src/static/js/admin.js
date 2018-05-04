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

// Multi-edit
var articles = document.getElementsByClassName('admin-article');
document.getElementById('apply-public-state').addEventListener('click', applyPublicState);

function toggleSelectArticle (e) {
  e.target.classList.toggle('admin-article-selected');
}

function reqComplete (e) {
  var response = JSON.parse(e.target.responseText);
  var q = '[data-id=' + response.id + ']';
  var element = document.querySelector(q);
  var publicElement = element.querySelector('[class*=" admin-public-"]');
  publicElement.classList.remove('admin-public-false');
  publicElement.classList.remove('admin-public-true');
  publicElement.classList.remove('admin-public-link');
  switch (response.state){
    case '0':
      publicElement.classList.add('admin-public-false');
      publicElement.innerHTML = 'Private';
      break;
    case '1':
      publicElement.classList.add('admin-public-true');
      publicElement.innerHTML = 'Public';
      break;
    case '2':
      publicElement.classList.add('admin-public-link');
      publicElement.innerHTML = 'Link Only';
      break;
  }
}

function reqAbort (e) {
  console.log('Article publicity state change aborted!');
}

function reqError (e) {
  console.log('Article publicity state change error!');
  console.error(e);
}

function applyPublicState () {
  var selectedArticles = document.getElementsByClassName('admin-article-selected');
  if (selectedArticles.length < 1) {
    return alert('No selected articles!');
  }
  var confim = confirm('Press OK to proceed with applying changes.');
  if (!confim) {
    return;
  }

  for (var i = 0; i < selectedArticles.length; i++) {
    var id = selectedArticles[i].dataset.id;
    var state = document.getElementById('public').value || 0;
    var x = new XMLHttpRequest();
    x.open('POST', '/api/article/public-state');
    x.setRequestHeader('csrf-token', document.getElementById('_csrf').innerText);
    x.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    x.onreadystatechange = function (ev) {
      if (x.readyState === XMLHttpRequest.DONE) {
        reqComplete(ev);
      }
    };
    x.onerror = reqError;
    x.onabort = reqAbort;
    x.send(JSON.stringify({
      id: id,
      state: state
    }));
  }
}

for (var i = 0; i < articles.length; i++) {
  articles[i].addEventListener('click', toggleSelectArticle);
}

// Admin navigation

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
