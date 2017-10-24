'use strict';

const config = require('./config');
const env = process.env.NODE_ENV || 'development';
const envtConfig = config[env]; // env specific values

module.exports = {
  getEnv: () => {
    return env;
  },
  getDirUri: () => process.env.DIR_URI || envtConfig.dirUri,
  getStatusMsgs: () => {
    return config.statusMsgs;
  },
  getURL: () => {
    return envtConfig.url;
  }
};
