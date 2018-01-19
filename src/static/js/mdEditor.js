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
var editor = document.getElementById('editor');
var editorOut = document.getElementById('editorOut');
var cmReader = new commonmark.Parser();
var cmRenderer = new commonmark.HtmlRenderer();

editor.addEventListener('keyup', onEdit);

function processMarkdown (input) {
  var parsed = cmReader.parse(input);

  var walker = parsed.walker();
  var event, node;

  while ((event = walker.next())) {
    node = event.node;
    if (event.entering && node.type === 'code_block') {
      var lang = Prism.languages[node.info];
      var langName = node.info;
      if (!lang) {
        langName = 'bash';
        lang = Prism.languages.bash;
      }
      var newNode = new commonmark.Node('html_block');
      var className = 'language-' + langName;
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

var changesMade = false;
onEdit();
// Set the changes made flag back to false after running the "onEdit" function once to require the
// user to make changes to trigger the confirmation.
changesMade = false;

window.onbeforeunload = function () {
  if (changesMade) {
    return 'Are you sure you want to leave?';
  }
};
