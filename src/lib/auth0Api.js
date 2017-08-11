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
const request = require('request');
const config = require('../helpers/configStub')('main');

let AuthToken, AuthTokenExpiryTime;

function hasAuthTokenExpired () {
  return Date.now() > AuthTokenExpiryTime;
}

function getAuthToken (cb) {
  const options = {
    method: 'POST',
    url: config.auth.domain + '/oauth/token',
    headers: {'content-type': 'application/json'},
    body: {
      grant_type: 'client_credentials',
      client_id: config.auth.id,
      client_secret: config.auth.secret,
      audience: config.auth.apiBaseUrl
    },
    json: true
  };
  request(options, function (err, req, body) {
    if (err) {
      console.error(err);
      return cb(err);
    }
    AuthTokenExpiryTime = Date.now() + body.expires_in;
    AuthToken = body.access_token;
    cb(null);
  });
}

function queryApi (opts, cb) {
  if (!AuthToken || hasAuthTokenExpired()) {
    getAuthToken(function (err) {
      if (err) {
        cb(err);
      } else {
        queryApi(opts, cb);
      }
    });
  } else {
    opts.url = config.auth.apiBaseUrl + opts.url;
    opts.headers = {
      Authorization: 'Bearer ' + AuthToken,
      'content-type': 'application/json'
    };
    request(opts, function (err, req, body) {
      if (err) {
        return cb(err);
      }
      let temp = JSON.parse(body);
      cb(null, temp);
    });
  }
}

function queryApiPromise (opts) {
  return new Promise((resolve, reject) => {
    queryApi(opts, (err, data) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(data);
      }
    });
  });
}

module.exports = {
  queryApi: queryApi,
  queryApiPromise: queryApiPromise
};
