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

const aboutSchema = new Schema({
  _id: {type: String, default: shortId.generate},
  rawBody: {type: String, required: true},
  body: {type: String, required: true},
  postedAt: {type: Date, default: Date.now},
  active: {type: Boolean, default: false}
});

aboutSchema.statics.setActive = function (id) {
  return new Promise((resolve, reject) => {
    this.model('about')
      .findOneAndUpdate({active: true}, {$set: {active: false}})
      .lean()
      .exec()
      .then(() => {
        return this.model('about')
          .findByIdAndUpdate(id, {$set: {active: true}})
          .lean()
          .exec();
      })
      .then(() => {
        return resolve();
      })
      .catch((err) => {
        return reject(err);
      });
  });
};

mongoose.model('about', aboutSchema);
