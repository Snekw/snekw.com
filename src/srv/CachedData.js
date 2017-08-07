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
const models = require('../db/models.js');
const redis = require('redis');
const client = redis.createClient();

client.flushall();

// 7d cache expiry
const expireCacheTime = 60 * 60 * 24 * 7;

function getProjects () {
  return new Promise(function (resolve, reject) {
    client.get('projects', (err, data) => {
      if (err) {
        return reject(err);
      }
      if (!data) {
        return getProjectsFromMongoose().then(data => {
          return resolve(data);
        }).catch(err => {
          return reject(err);
        });
      } else {
        return resolve(JSON.parse(data));
      }
    });
  });
}

function getProjectsFromMongoose () {
  return new Promise(function (resolve, reject) {
    models.project.find()
      .select('author brief title indexImageUrl updatedAt postedAt')
      .sort('-postedAt')
      .limit(10)
      .lean()
      .exec((err, data) => {
        if (err) {
          return reject(err);
        } else {
          client.set('projects', JSON.stringify(data), 'EX', expireCacheTime);
          return resolve(data);
        }
      });
  });
}

module.exports = {
  getProjects: getProjects,
  getProjectsFromMongoose: getProjectsFromMongoose
};
