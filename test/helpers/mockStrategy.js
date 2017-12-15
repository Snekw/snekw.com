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
const passport = require('passport');
const util = require('util');

function MockStrategy (options, verify) {
  this.name = 'mock';
  this.passAuthentication = options.passAuthentication || false;
  this.userObj = options.user || {id: '1'};
  this.verify = verify;
}

util.inherits(MockStrategy, passport.Strategy);

MockStrategy.prototype.authenticate = function authenticate (req) {
  if (this.passAuthentication) {
    let self = this;
    this.verify(this.userObj, function (err, resident) {
      if (err) {
        self.fail(err);
      } else {
        self.success(resident);
      }
    });
  } else {
    this.fail('Unauthorized');
  }
};

module.exports = MockStrategy;
