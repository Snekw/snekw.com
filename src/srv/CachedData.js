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

const client = redis.createClient({
  password: config.db.redis.password
});

// Force cache flush when restarting the app in dev mode
if (config.DEV === true) {
  client.flushall();
}

if (config.db.redis.password) {
  client.config('set', 'requirepass', config.db.redis.password);
  client.auth(config.db.redis.password);
}

function getCachedOrDb (key, query) {
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
          client.set(key, JSON.stringify(dbData));

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
        return reject(new Error('No data returned from db.'));
      }
      client.set(key, JSON.stringify(data));
      debug('Cache updated for key: ' + key);
      return resolve(data);
    });
  });
}

module.exports = {
  getCachedOrDb: getCachedOrDb,
  updateCache: updateCache
};
