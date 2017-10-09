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
module.exports = {
  DEV: true,
  devSettings: {
    recompileHBS: true,
    invalidateCache: false
  },
  server: {
    useHttps: false,
    port: 3000,
    sessionSecret: 'Use your own'
  },
  db: {
    mongo: {
      connectionString: 'mongodb://localhost/dbhere'
    },
    redis: {
    }
  },
  auth: {
    secret: 'yep',
    id: 'not',
    domain: 'telling',
    apiBaseUrl: 'these',
    callback: 'http://localhost:3000/callback'
  }
};