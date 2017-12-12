/**
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
let editor = document.getElementById('editor');
let editorOut = document.getElementById('editorOut');
const cmReader = new commonmark.Parser();
const cmRenderer = new commonmark.HtmlRenderer();

editor.addEventListener('keyup', onEdit);

function processMarkdown (input) {
  let parsed = cmReader.parse(input);

  let walker = parsed.walker();
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
      let className = 'language-' + langName;
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

  editorOut.innerHTML = processMarkdown(editor.value);
}

onEdit();
