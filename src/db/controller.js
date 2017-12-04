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
const config = require('../helpers/configStub')('main');
const debug = require('debug')('App:DB');
const cachedData = require('./CachedData');

mongoose.Promise = global.Promise;

mongoose.connect(config.db.mongo.connectionString, {useMongoClient: true}).then(() => {
  console.log('Connected to database: ' + mongoose.connection.db.s.databaseName);
  debug('Connected to database');
  cachedData.setupCache();
}).catch((err) => {
  console.error('Failed to connect to database: ' + config.db.mongo.connectionString);
  console.error(err);
});
