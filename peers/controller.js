'use strict';

const config = require('../config/');
const fs = require('fs');
const yaml = require('js-yaml');

const createPeer = (req, res) => {
  return res.status(201).json({"message": "Peer created"});
};

const createCryptoConfig = (req, res) => {
  const doc = yaml.safeDump(req.body);
  fs.writeFileSync(config.getDirUri() + '/crypto-config.yaml', doc);
  return res.status(201).json({"message": "crypto-config.yaml created at " + config.getDirUri()});
};


module.exports = {
  createCryptoConfig,
  createPeer
};
