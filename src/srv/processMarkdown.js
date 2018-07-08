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
const commonmark = require('commonmark');
const cmReader = new commonmark.Parser();
const cmRenderer = new commonmark.HtmlRenderer({softbreak: ' ', safe: false});
const getSrcSet = require('./hbsSystem').getSrcSet;
const path = require('path');
const Prism = require('prismjs');
require('prismjs/components/prism-javascript');
require('prismjs/components/prism-markdown');
require('prismjs/components/prism-c');
require('prismjs/components/prism-cpp');
require('prismjs/components/prism-csharp');
require('prismjs/components/prism-bash');
require('prismjs/components/prism-handlebars');
require('prismjs/components/prism-scss');
require('prismjs/components/prism-css');
require('prismjs/components/prism-http');

function processCodeBlock (node) {
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

function processImage (node, event) {
  let newNode = new commonmark.Node('html_block');
  newNode.literal =
    `<a href="${node.destination}">
<img src"${node.destination}"
alt="${node.firstChild.literal}" 
srcset="${getSrcSet(node.destination.replace('/', ''))}">
</img></a>`;
  node.insertBefore(newNode);
  node.unlink();
}

function processMarkdown (input) {
  let parsed = cmReader.parse(input);

  let walker = parsed.walker();
  let event, node;

  while ((event = walker.next())) {
    node = event.node;

    switch (node.type) {
      case 'code_block':
        if (!event.entering) {
          break;
        }
        processCodeBlock(node);
        break;
      case 'image':
        if (event.entering) {
          break;
        }
        processImage(node, event);
        break;
      default:
        break;
    }
  }

  return cmRenderer.render(parsed);
}

module.exports = processMarkdown;
