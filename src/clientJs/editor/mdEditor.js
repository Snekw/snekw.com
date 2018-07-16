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

let changesMade = false;
let editor;
let editorOut;
let cmReader;
let cmRenderer;

window.onbeforeunload = function () {
  if (changesMade) {
    return 'Are you sure you want to leave?';
  }
};

function processMarkdown (input) {
  const parsed = cmReader.parse(input);

  const walker = parsed.walker();
  let event, node;

  while ((event = walker.next())) {
    node = event.node;
    if (event.entering && node.type === 'code_block') {
      let lang = Prism.languages[node.info];
      let langName = node.info;
      if (!lang) {
        langName = 'bash';
        lang = Prism.languages.bash;
      }
      let newNode = new commonmark.Node('html_block');
      const className = 'language-' + langName;
      newNode.literal = '<pre class="' + className + '"><code class="' +
        className + '">' +
        Prism.highlight(node.literal, lang) + '</code></pre>';
      node.insertBefore(newNode);
      node.unlink();
    }
  }

  return cmRenderer.render(parsed);
}

function onEdit () {
  changesMade = true;
  editorOut.innerHTML = processMarkdown(editor.value);
}

// Set the changes made flag back to false after running the "onEdit" function once to require the
// user to make changes to trigger the confirmation.

function processSubmit () {
  changesMade = false;
}

function updatedTimeControl (e) {
  if (e.target) {
    e = e.target;
  }
  document.getElementById('postedAt').disabled = !e.checked;
  document.getElementById('postedAtHours').disabled = !e.checked;
  document.getElementById('timeZone').disabled = !e.checked;
  document.getElementById('setPublicationTime').disabled = !e.checked;
}

window.onload = function () {
  editor = document.getElementById('editor');
  editorOut = document.getElementById('editorOut');
  cmReader = new commonmark.Parser();
  cmRenderer = new commonmark.HtmlRenderer();

  editor.addEventListener('keyup', onEdit);
  onEdit();

  let elements = document.getElementsByTagName('form');
  for (let i = 0; i < elements.length; i++) {
    elements[i].addEventListener('submit', processSubmit);
  }

  const updateTimeControl = document.getElementById('editUpdatedAt');
  if (updateTimeControl) {
    updateTimeControl.addEventListener('click', updatedTimeControl);
    updatedTimeControl(document.getElementById('editUpdatedAt'));
  }

  const offset = new Date().getTimezoneOffset();
  const postedAtHours = document.getElementById('postedAtHours');
  if (!postedAtHours) {
    return;
  }
  let time = new Date('1970-01-01T' + postedAtHours.value + 'Z');
  time = new Date(time.getTime() + offset * 60000);
  postedAtHours.value = (time.getHours().toString().length === 1
    ? '0' + time.getHours()
    : time.getHours()) + ':' + time.getMinutes();
  document.getElementById('timeZone').value = offset;
};
