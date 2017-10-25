'use strict';

const { exec } = require('child_process');
const fs = require('fs');
const yaml = require('js-yaml');

const config = require('../config/');

const createYamlFile = (req, res) => {
  const fileName = req.query.fileName;
  const doc = yaml.safeDump(req.body);
  fs.writeFileSync(config.getDirUri() + fileName, doc);
  return res.status(201).json({ "message": "YAML file created", path: config.getDirUri() + fileName });
};

const createPeer = (req, res) => {
  return res.status(201).json({ "message": "Peer created" });
};

const runCryptogen = (req, res) => {
  const fileName = req.query.fileName;
  exec(`cd ${config.getDirUri()} && cryptogen generate --config=${fileName}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`\n!!! cryptogen exec error: ${error}`);
      return res.status(500).json({ message: "Something went wrong. Check console" });
    }
    return res.status(201).json({ "message": "certificates generated at: " + config.getDirUri() });
  });
};


module.exports = {
  createPeer,
  createYamlFile,
  runCryptogen
};
