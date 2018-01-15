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
const sinon = require('sinon');
chai.use(chaiHttp);

describe('/user', function () {
  let agent;
  beforeEach(function () {
    agent = chai.request.agent(app);
  });

  it('should redirect away if not logged in', function (done) {
    chai.request(app)
      .get('/user')
      .redirects(0)
      .end(function (err, res) {
        expect(err).to.exist;
        expect(res).to.redirect;
        done();
      });
  });

  it('should show user page if logged in', function (done) {
    passportMock(app, {
      passAuthentication: true,
      user: {
        id: '1',
        username: 'Test',
        picture: 'a pic'
      }
    });
    agent
      .get('/mock/login')
      .end(function (err, res) {
        if (err) throw err;
        expect(res).to.have.cookie('connect.sid');

        agent
          .get('/user')
          .end(function (err, res) {
            expect(err).to.not.exist;
            expect(res).to.exist;
            expect(res).status(200);
            expect(res.body.context).to.exist;
            expect(res.body.context.user.username).length.be.greaterThan(1);
            expect(res.body.context.user.id).length.be.greaterThan(0);
            expect(res.body.context.user.picture).length.be.greaterThan(0);
            done();
          });
      });
  });

  it('should show redirect to /user/update if no username set', function (done) {
    passportMock(app, {
      passAuthentication: true,
      user: {
        id: '1',
        username: '',
        picture: 'a pic'
      }
    });
    agent
      .get('/mock/login')
      .end(function (err, res) {
        if (err) throw err;
        expect(res).to.have.cookie('connect.sid');

        agent
          .get('/user')
          .redirects(0)
          .end(function (err, res) {
            expect(err).exist;
            expect(res).to.redirectTo('/user/update');
            expect(res).status(302);
            done();
          });
      });
  });

  describe('/update', function () {
    it('should show page to update username and picture', function (done) {
      passportMock(app, {
        passAuthentication: true,
        user: {
          id: '1',
          username: 'testName',
          picture: 'a pic'
        }
      });
      agent
        .get('/mock/login')
        .end(function (err, res) {
          if (err) throw err;
          expect(res).to.have.cookie('connect.sid');
          agent
            .get('/user/update')
            .redirects(0)
            .end(function (err, res) {
              expect(err).to.not.exist;
              expect(res).status(200);
              expect(res.body.context).to.exist;
              expect(res.body.context.user.username).to.equal('testName');
              expect(res.body.context.user.picture).to.equal('a pic');
              expect(res.body.context.csrfToken).length.greaterThan(0);
              done();
            });
        });
    });

    it('should redirect to login if not logged in', function (done) {
      agent
        .get('/user/update')
        .redirects(0)
        .end(function (err, res) {
          expect(err).exist;
          expect(res).to.redirectTo('/login');
          expect(res).status(302);
          done();
        });
    });

    it('should allow logged in user to change username', function (done) {
      passportMock(app, {
        passAuthentication: true,
        user: {
          id: '1',
          username: 'testName',
          picture: 'a pic'
        }
      });
      agent
        .get('/mock/login')
        .end(function (err, res) {
          if (err) throw err;
          expect(res).to.have.cookie('connect.sid');
          agent.get('/user/update')
            .end(function (err, res) {
              expect(err).to.be.null;
              expect(res).to.exist;
              expect(res.body.context.csrfToken).length.greaterThan(0);
              let csrf = res.body.context.csrfToken;

              let auth0Api = require('../../src/lib/auth0Api');
              let stub = sinon.stub(auth0Api, 'queryApi')
                .callsFake(function (opts, cb) {
                  let n = JSON.parse(opts.body);
                  return cb(null, {
                    app_metadata: {
                      username: n.app_metadata.username
                    },
                    user_metadata: {}
                  });
                });

              agent
                .post('/user/update/username')
                .type('form')
                .send({
                  'username': 'newName',
                  '_csrf': csrf
                })
                .end(function (err, res) {
                  expect(err).to.not.exist;
                  expect(res).status(200);
                  expect(res).to.redirect;
                  expect(res.body.context).to.exist;
                  expect(res.body.context.user.username).to.equal('newName');
                  expect(res.body.context.user.picture).to.equal('a pic');
                  stub.restore();
                  done();
                });
            });
        });
    });

    it('should not allow logged in user to change username to invalid username', function (done) {
      passportMock(app, {
        passAuthentication: true,
        user: {
          id: '1',
          username: 'testName',
          picture: 'a pic'
        }
      });
      agent
        .get('/mock/login')
        .end(function (err, res) {
          if (err) throw err;
          expect(res).to.have.cookie('connect.sid');
          agent.get('/user/update')
            .end(function (err, res) {
              expect(err).to.be.null;
              expect(res).to.exist;
              expect(res.body.context.csrfToken).length.greaterThan(0);
              let csrf = res.body.context.csrfToken;

              let auth0Api = require('../../src/lib/auth0Api');
              let stub = sinon.stub(auth0Api, 'queryApi')
                .callsFake(function (opts, cb) {
                  let n = JSON.parse(opts.body);
                  return cb(null, {
                    app_metadata: {
                      username: n.app_metadata.username
                    },
                    user_metadata: {}
                  });
                });

              agent
                .post('/user/update/username')
                .type('form')
                .send({
                  'username': 'new name ! bad name',
                  '_csrf': csrf
                })
                .end(function (err, res) {
                  expect(err).to.exist;
                  expect(res).status(400);
                  expect(res.body.context).to.exist;
                  expect(res.body.context.user.username).to.equal('testName');
                  expect(res.body.context.error).to.exist;
                  stub.restore();
                  done();
                });
            });
        });
    });
  });

  afterEach(function () {
  });
});
