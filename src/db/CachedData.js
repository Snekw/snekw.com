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
const redis = require('redis');
const config = require('../helpers/configStub')('main');
const debug = require('debug')('App::Cache');
const querys = require('./querys');
const models = require('./models');

const keys = {
  indexProjects: 'indexProjects',
  about: 'about',
  projectCount: 'pCount'
};

let redisClientOptions = {
  password: config.db.redis.password
};

// Don't supply password if the server doesn't use it
if (!config.db.redis.password) {
  redisClientOptions = {};
}

const client = redis.createClient(redisClientOptions);

// Force cache flush when restarting the app in dev mode
if (config.DEV === true) {
  client.flushall();
}

function setupCache () {
  client.flushall();
  querys.getLatestProjects.exec((err, data) => {
    if (err) {
      return err;
    }
    data.map(d => {
      client.set(d._id, JSON.stringify(d));
    });
  });
  updateCache(keys.indexProjects, querys.indexProjectsQuery).catch(err => {
    console.log(err);
  });
  updateCache(keys.about, querys.aboutGetQuery).catch(err => {
    console.log(err);
  });
  updateCache(keys.projectCount, querys.getProjectCount).catch(err => {
    console.log(err);
  });
}

function getCachedOrDb (key, query, save = true) {
  if (!key || !query) {
    throw new Error('No key specified');
  }

  return new Promise((resolve, reject) => {
    client.get(key, (err, data) => {
      if (err) {
        return reject(err);
      }

      if (!data) {
        query.lean().exec((err, dbData) => {
          if (err) {
            return reject(err);
          }
          if (!dbData) {
            return reject(new Error('No data in database'));
          }
          if (save) {
            client.set(key, JSON.stringify(dbData));
          }

          debug('Cache returned from db.');
          return resolve(dbData);
        });
      } else {
        debug('Cache returned from redis');
        return resolve(JSON.parse(data));
      }
    });
  });
}

function updateCache (key, query) {
  return new Promise((resolve, reject) => {
    query.exec((err, data) => {
      if (err) {
        return reject(err);
      }
      if (!data) {
        client.del(key);
        return reject(new Error('No data returned from db for key: ' + key));
      }
      client.set(key, JSON.stringify(data));
      debug('Cache updated for key: ' + key);
      return resolve(data);
    });
  });
}

module.exports = {
  keys: keys,
  getCachedOrDb: getCachedOrDb,
  updateCache: updateCache,
  setupCache: setupCache
};
