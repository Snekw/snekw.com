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
const config = require('../helpers/configStub')('main');

class ErrorSNW extends Error {
  constructor () {
    super();
    this.name = this.constructor.name;
    this.status = 500;
    this.data = {};
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = (new Error()).stack;
    }
  }
}

class ErrorMissingParameters extends ErrorSNW {
  constructor (parameters) {
    super();
    this.message = 'Missing parameters: ' + this._getParamsString(parameters);
    this.id = 'ERR_MISSING_PARAMETER';
    this.data = parameters;
    this.status = 400;
  }

  _getParamsString (parameters) {
    let s = '';
    parameters.map(p => {
      s += p + ' ';
    });
    return s;
  }
}

class ErrorUploadRejected extends ErrorSNW {
  constructor (err) {
    super();
    this.message = 'Upload rejected';
    this.data = normalizeError(err);
    this.id = 'ERR_FILE_REJECTED';
    this.inner = err;
    this.status = 400;
  }
}

class ErrorUploadMimeType extends ErrorSNW {
  constructor (mime) {
    super();
    this.message = 'Invalid mimetype.';
    this.data = mime;
    this.id = 'ERR_FILE_MIME';
    this.status = 400;
  }
}

class ErrorDatabaseError extends ErrorSNW {
  constructor (inner, id) {
    super();
    this.message = 'Database error: ' + id;
    this.id = 'ERR_DB_' + id.toUpperCase();
    this.inner = inner;
    this.status = 400;
  }
}

class ErrorAlreadyExists extends ErrorSNW {
  constructor (what) {
    super();
    this.message = what;
    this.id = 'ERR_ALREADY_EXISTS';
    this.status = 200;
  }
}

class ErrorMissing extends ErrorSNW {
  constructor (what) {
    super();
    this.message = what;
    this.id = 'ERR_MISSING';
    this.status = 200;
  }
}

class ErrorNoFiles extends ErrorSNW {
  constructor (message) {
    super();
    this.message = 'Request didn\'t contain any files';
    this.id = 'ERR_NO_FILES';
    this.status = 200;
  }
}

function normalizeError (err) {
  let ret = {
    status: err.status || 500,
    message: err.message,
    data: err.data || {}
  };
  // Return stack and full error object if in developer mode
  if (config.DEV === true && process.env.NODE_ENV !== 'production') {
    ret.stack = err.stack;
    ret.full = err;
  }

  return ret;
}

module.exports = {
  normalizeError,
  ErrorUploadRejected,
  ErrorMissingParameters,
  ErrorDatabaseError,
  ErrorUploadMimeType,
  ErrorAlreadyExists,
  ErrorMissing
};
