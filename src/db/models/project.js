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
const mongoose = require('mongoose');
const shortId = require('shortid');

const projectSchema = new mongoose.Schema({
  _id: {type: String, default: shortId.generate},
  title: {type: String, required: true},
  body: {type: String, required: true},
  rawBody: {type: String, required: true},
  brief: {type: String, required: true},
  postedAt: {type: Date, default: Date.now, required: true},
  updatedAt: {type: Date, default: Date.now},
  indexImageUrl: {type: String, default: '/defaultProjectImage.png'},
  author: {type: String, required: true}
});

mongoose.model('project', projectSchema);
