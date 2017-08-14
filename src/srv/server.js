#!/usr/bin/env node/
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

/**
 * Module dependencies.
 */

let app = require('./app.js');
let debug = require('debug')('App:Server');
let https = require('https');
let http = require('http');
let fs = require('fs');
let config = require('../helpers/configStub')('main');
debug('Starting express...');

/**
 * Get port from environment and store in Express.
 */
debug('ENV port: ' + process.env.port);
let port = normalizePort(process.env.PORT || config.server.port || '3001');
debug('Used port: ' + port);

/**
 * Create HTTPs server.
 */

let useHttps = config.server.useHttps;
let server = null;
debug('useHttps: ' + useHttps);
if (useHttps === true) {
  debug('Using https.');
  debug('Creating http server.');
  http.createServer(function (req, res) {
    res.writeHead(301, {'Location': 'https://' + req.headers.host + req.url});
    res.end();
  }).listen(80);
  debug('Http server created for redirection.');
  console.log('Redirecting http traffic to https!');

  debug('Creating https server.');
  server = https.createServer({
    key: fs.readFileSync('localhost.key'),
    cert: fs.readFileSync('localhost.crt')
  }, app);
  debug('Https server created.');
} else {
  debug('Not using https.');
  debug('Creating http server.');
  server = http.createServer(app);
  debug('Http server created.');
}

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort (val) {
  let port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError (error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  let bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      throw new Error(bind + ' requires elevated privileges');
    case 'EADDRINUSE':
      throw new Error(bind + ' is already in use');
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening () {
  let addr = server.address();
  let bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
