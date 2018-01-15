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
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const app = require('../../src/srv/app');
const passportMock = require('../helpers/passportMock');
chai.use(chaiHttp);

describe('auth', function () {
  it('should redirect to auth0', function (done) {
    chai.request(app)
      .get('/login')
      .redirects(0)
      .end(function (err, res) {
        expect(err).to.exist;
        expect(res).to.redirect;
        done();
      });
  });

  describe('mock test', function (done) {
    it('Should return user with id of 1', function (done) {
      passportMock(app, {
        passAuthentication: true,
        user: {
          id: '1'
        }
      });
      chai.request(app)
        .get('/mock/login')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res.body.user).to.exist;
          expect(res.body.user.id).to.equal('1');
          done();
        });
    });

    it('Should return user with id of 2', function (done) {
      passportMock(app, {
        passAuthentication: true,
        user: {
          id: '2'
        }
      });
      chai.request(app)
        .get('/mock/login')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res.body.user).to.exist;
          expect(res.body.user.id).to.equal('2');
          done();
        });
    });

    it('Should fail if passAuthentication is false', function (done) {
      passportMock(app, {
        passAuthentication: false,
        user: {
          id: '1'
        }
      });
      chai.request(app)
        .get('/mock/login')
        .end(function (err, res) {
          expect(err).to.exist;
          expect(res).status(401);
          done();
        });
    });
  });
});
