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
const MockStrategy = require('./mockStrategy');

module.exports = function (app, options) {
  passport.use(new MockStrategy(options, function (user, done) {
    let mock = {
      id: user.id || '1',
      app_metadata: user.app_metadata || {},
      user_metadata: user.user_metadata || {},
      username: user.username || '',
      picture: user.picture || '',
      locale: user.locale || 'en'
    };
    return done(null, mock);
  }));
  app.get('/mock/login',
    passport.authenticate('mock'));

  // Move the route that was added to be before the main handler that
  // is before the error handlers
  let temp = app._router.stack[app._router.stack.length - 1];
  app._router.stack.splice(app._router.stack.length - 1 - 3, 0, temp);
  app._router.stack.pop();
};
