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
const Schema = mongoose.Schema;
const shortId = require('shortid');

const articleSchema = new Schema({
  _id: {type: String, default: shortId.generate},
  title: {type: String, required: true},
  body: {type: String, required: true},
  rawBody: {type: String, required: true},
  brief: {type: String, required: true},
  postedAt: {type: Date, default: null},
  updatedAt: {type: Date, default: null},
  indexImageUrl: {type: String, default: 'https://i.imgur.com/5Dmkrgz.png'},
  author: {
    id: {type: String, required: true},
    username: {type: String, required: false}
  },
  public: {type: Number, default: false}, // 0 private, 1 public, 2 not listed
  meta: {
    description: {type: String, required: false}
  }
});

mongoose.model('article', articleSchema);
