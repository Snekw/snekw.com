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
const utility = require('../../src/helpers/fs-utility');
const logger = require('./logger');

const configFileReader = utility.readFileGenerator('./dist/config', '.js');
const configFileSaver = utility.saveFileGenerator('./dist/config', '.js');
let oldConfigs = {};

/**
 * Saves the config file inside of internal memory
 * @param fileName Name of the config file
 * @returns {Promise<any>}
 */
function saveOldConfig (fileName) {
  return new Promise((resolve, reject) => {
    configFileReader(fileName)
      .then(data => {
        oldConfigs[fileName] = data;
        logger(`Config '${fileName}' saved to memory.`);
        return resolve();
      })
      .catch(err => {
        if (err.message && err.message.includes('File doesn\'t exist:')) {
          logger(`Config '${fileName}' doesn't exist. Not saved.`);
          return resolve();
        }
        logger(`Config '${fileName}' not saved to memory.`);
        return reject(err);
      });
  });
}

/**
 * Restores the config file
 * @param fileName Name of the config
 * @returns {Promise<any>}
 */
function restoreConfig (fileName) {
  return new Promise((resolve, reject) => {
    if (!oldConfigs || !oldConfigs[fileName]) {
      logger(`Config '${fileName}' not restored.`);
      return resolve();
    }
    configFileSaver(fileName)(oldConfigs[fileName])
      .then(() => {
        logger(`Config '${fileName}' restored.`);
        return resolve();
      })
      .catch(err => {
        logger(`Config '${fileName}' not restored.`);
        return reject(err);
      });
  });
}

module.exports = {
  saveOldConfig,
  restoreConfig
};
