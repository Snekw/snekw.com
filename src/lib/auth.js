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
const Auth0Strategy = require('passport-auth0');
const router = require('express').Router();
const config = require('../helpers/configStub')('main');
const normalizeError = require('../srv/ErrorJSONAPI').normalizeError;
const request = require('request');

const env = {
  AUTH0_CLIENT_ID: config.auth.id,
  AUTH0_DOMAIN: config.auth.domain,
  AUTH0_CALLBACK_URL: config.auth.callback,
  AUTH0_SECRET: config.auth.secret
};

const strategy = new Auth0Strategy(
  {
    domain: env.AUTH0_DOMAIN,
    clientID: env.AUTH0_CLIENT_ID,
    clientSecret: env.AUTH0_SECRET,
    callbackURL: env.AUTH0_CALLBACK_URL
  },
  (accessToken, refreshToken, extraParams, profile, done) => {
    request.get('https://' + env.AUTH0_DOMAIN + '/userinfo', {
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    }, (err, response, body) => {
      if (err) {
        return (err);
      }
      const namespace = 'http://snekw.com/';
      let temp = JSON.parse(body);
      let user = {
        id: temp.sub,
        app_metadata: temp[namespace + 'app_metadata'],
        user_metadata: temp[namespace + 'user_metadata'],
        username: '',
        picture: temp.picture,
        locale: temp.locale
      };
      if (user.app_metadata) {
        user.username = user.app_metadata.username || '';
      }
      if (user.user_metadata) {
        user.picture = user.user_metadata.picture || temp.picture;
      }

      return done(null, user);
    });
  }
);

const auth0LoginOpts = {
  clientId: env.AUTH0_CLIENT_ID,
  domain: env.AUTH0_DOMAIN,
  redirectUri: env.AUTH0_CALLBACK_URL,
  audience: 'https://' + env.AUTH0_DOMAIN + '/userinfo',
  responseType: 'code',
  scope: 'openid profile email'
};

const auth0CallbackOpts = {
  failureRedirect: '/'
};

let errorPageFunc = function () {
  throw new Error('Error page func not set');
};

function setupPassport () {
  passport.use(strategy);

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user);
  });
}

function getRoutes () {
  router.get('/login', passport.authenticate('auth0', auth0LoginOpts),
    function (req, res) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.redirect('/');
    }
  );

  router.get('/logout', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    req.logout();
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
        res.status(500);
        return res.send(errorPageFunc(normalizeError(err)));
      }
      res.redirect('/');
    });
  });

  router.get('/callback', passport.authenticate('auth0', auth0CallbackOpts),
    function (req, res) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.redirect(req.session.returnTo || '/user');
    }
  );

  return router;
}

function setErrorPageFunc (func) {
  errorPageFunc = func;
}

module.exports = {
  setupPassport: setupPassport,
  getRoutes: getRoutes,
  setErrorPageFunc: setErrorPageFunc
};
