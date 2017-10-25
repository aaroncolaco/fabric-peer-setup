'use strict';

const { exec } = require('child_process');
const fs = require('fs');
const yaml = require('js-yaml');

const config = require('../config/');

const createAnchorPeerFile = (req, res) => {
  const channelName = req.query.channelName;
  const profileName = req.query.profileName;
  const orgName = req.query.orgName;

  exec(`cd ${config.getDirUri()} && export FABRIC_CFG_PATH=$PWD && export CHANNEL_NAME=${channelName} && configtxgen -profile ${profileName} -outputAnchorPeersUpdate ./channel/${orgName}Anchors.tx -channelID $CHANNEL_NAME -asOrg ${orgName}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`\n!!! configtxgen exec anchor peer error: ${error}`);
      return res.status(500).json({ message: "Something went wrong. Check console" });
    }
    return res.status(201).json({ "message": "created anchor peer file", "path": config.getDirUri() + `channel/${orgName}Anchors.tx` });
  });
};

const createChannel = (req, res) => {
  const channelName = req.query.channelName;
  const profileName = req.query.profileName;

  exec(`cd ${config.getDirUri()} && export FABRIC_CFG_PATH=$PWD && export CHANNEL_NAME=${channelName} && configtxgen -profile ${profileName} -outputCreateChannelTx ./channel/${channelName}.tx -channelID $CHANNEL_NAME`, (error, stdout, stderr) => {
    if (error) {
      console.error(`\n!!! configtxgen exec channel error: ${error}`);
      return res.status(500).json({ message: "Something went wrong. Check console" });
    }
    return res.status(201).json({ "message": "created channel file", "path": config.getDirUri() + `channel/${channelName}.tx` });
  });
};

const createGenesisBlock = (req, res) => {
  const profileName = req.query.profileName;

  exec(`cd ${config.getDirUri()} && export FABRIC_CFG_PATH=$PWD && mkdir -p channel && configtxgen -profile ${profileName} -outputBlock ./channel/genesis.block`, (error, stdout, stderr) => {
    if (error) {
      console.error(`\n!!! configtxgen exec error: ${error}`);
      return res.status(500).json({ message: "Something went wrong. Check console" });
    }
    return res.status(201).json({ "message": "created genesis file", "path": config.getDirUri() + 'channel/genesis.block' });
  });
};

const createPeer = (req, res) => {
  return res.status(201).json({ "message": "Peer created" });
};

const createYamlFile = (req, res) => {
  const fileName = req.query.fileName || 'myYamlFile.yaml';
  const doc = yaml.safeDump(req.body);
  fs.writeFileSync(config.getDirUri() + fileName, doc);
  return res.status(201).json({ "message": "YAML file created", path: config.getDirUri() + fileName });
};

const runCryptogen = (req, res) => {
  const fileName = req.query.fileName || 'crypto-config.yaml';
  exec(`cd ${config.getDirUri()} && cryptogen generate --config=${fileName}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`\n!!! cryptogen exec error: ${error}`);
      return res.status(500).json({ message: "Something went wrong. Check console" });
    }
    return res.status(201).json({ "message": "certificates generated", "path": config.getDirUri() });
  });
};


module.exports = {
  createAnchorPeerFile,
  createChannel,
  createGenesisBlock,
  createPeer,
  createYamlFile,
  runCryptogen
};
