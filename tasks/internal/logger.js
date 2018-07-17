/**
 *  snekw.com,
 *  Copyright (C) 2018 Ilkka Kuosmanen
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
const {performance} = require('perf_hooks');

let lastLogTime = performance.now();

function toTime (ms) {
  const lm = ~(0);
  /* limit fraction */
  const fmt = new Date(ms).toISOString().slice(11, lm);

  if (ms >= 8.64e7) {  /* >= 24 hours */
    let parts = fmt.split(/:(?=\d{2}:)/);
    parts[0] -= -24 * (ms / 8.64e7 | 0);
    return parts.join(':');
  }

  return fmt;
}

function log (message) {
  const timeNow = performance.now();
  const timeSinceLast = timeNow - lastLogTime;
  lastLogTime = timeNow;
  console.log(`${new Date().toLocaleString()} | ${toTime(timeSinceLast)} | ${message}`);
}

module.exports = log;
