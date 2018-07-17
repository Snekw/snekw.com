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
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const baseFolder = process.argv[2];

let watches = [];

let buildInProgress = false;
let child;

let waitRun = 0;
let runnerRequested = false;

function runner () {
  buildInProgress = true;
  child = childProcess.fork('./tasks/internal/jsBuildFork');
  child.on('close', () => {
    console.log('Runner closed.');
    buildInProgress = false;
  });
}

function runnerWaiter () {
  if (runnerRequested && waitRun > 0) {
    waitRun--;
  } else if (runnerRequested) {
    runnerRequested = false;
    console.log('Runner run.');
    runner();
  }
}

function setupWatches (item) {
  if (fs.lstatSync(item).isDirectory()) {
    fs.readdirSync(item)
      .map(dir => setupWatches(path.resolve(path.join(item, dir))));

    watches.push(fs.watch(item,
      {
        persistent: false,
        recursive: false,
        encoding: 'utf8'
      },
      function () {
        if (buildInProgress) {
          child.kill();
        } else {
          runnerRequested = true;
          waitRun = 2;
        }
      }
    ));
  }
}

console.log('Watcher started');
setupWatches(path.resolve(baseFolder));

setInterval(runnerWaiter, 500);
runner();

const onExit = () => {
  console.log('Watcher closed');
  watches.forEach(watch => {
    console.log('Watch closed');
    watch.close();
  });
  if (child) {
    child.kill();
  }
  process.exit(0);
};

// process.on('beforeExit', onExit);
// process.on('exit', onExit);
process.on('SIGINT', onExit);
// process.on('SIGUSR1', onExit);
// process.on('SIGUSR2', onExit);
