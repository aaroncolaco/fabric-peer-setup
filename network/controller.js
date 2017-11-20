'use strict';

const _ = require('lodash');
const dirToJson = require('dir-to-json');
const fs = require('fs');
const yaml = require('js-yaml');

const config = require('../config/');
const helpers = require('./helpers');


const createAnchorPeerFile = (req, res) => {
  const channelName = req.query.channelName;
  const profileName = req.query.profileName;
  const orgName = req.query.orgName;

  const terminalCommand = `cd ${config.getDirUri()} && export FABRIC_CFG_PATH=$PWD && export CHANNEL_NAME=${channelName} && configtxgen -profile ${profileName} -outputAnchorPeersUpdate ./channel/${orgName}Anchors.tx -channelID $CHANNEL_NAME -asOrg ${orgName}`;

  helpers.runTerminalCommand(terminalCommand)
    .then(output => {
      return res.status(201).json({ "message": "created anchor peer file", "path": config.getDirUri() + `channel/${orgName}Anchors.tx` });
    })
    .catch(err => {
      console.error(`\n!!! Error generating Anchor Peer file: ${err}\n`);
      return errorResponse(res, 'Error generating Anchor Peer file', err);
    });
};

const createChannel = (req, res) => {
  const channelName = req.query.channelName;
  const profileName = req.query.profileName;

  const terminalCommand = `cd ${config.getDirUri()} && export FABRIC_CFG_PATH=$PWD && export CHANNEL_NAME=${channelName} && configtxgen -profile ${profileName} -outputCreateChannelTx ./channel/${channelName}.tx -channelID $CHANNEL_NAME`;

  helpers.runTerminalCommand(terminalCommand)
    .then(output => {
      return res.status(201).json({ "message": "created channel file", "path": config.getDirUri() + `channel/${channelName}.tx` });
    })
    .catch(err => {
      console.error(`\n!!! Error Creating Channel: ${err}\n`);
      return errorResponse(res, 'Error Creating Channel', err);
    });
};

const createGenesisBlock = (req, res) => {
  const profileName = req.query.profileName;

  const terminalCommand = `cd ${config.getDirUri()} && export FABRIC_CFG_PATH=$PWD && mkdir -p channel && configtxgen -profile ${profileName} -outputBlock ./channel/genesis.block`;

  helpers.runTerminalCommand(terminalCommand)
    .then(output => {
      return res.status(201).json({ "message": "created genesis file", "path": config.getDirUri() + 'channel/genesis.block' });
    })
    .catch(err => {
      console.error(`\n!!! Error generating Genesis File: ${err}\n`);
      return errorResponse(res, 'Error generating Genesis File', err);
    });
};

const createNetwork = (req, res) => {
  const fileName = req.query.fileName || 'docker-compose.yaml';
  const terminalCommand = `cd ${config.getDirUri()} && docker-compose -f ${fileName} up -d`;

  helpers.createBaseYamlFile()
    .then(success => {
      return helpers.runTerminalCommand(terminalCommand);
    })
    .then(output => {
      return res.status(201).json({ "message": "Network created" });
    })
    .catch(err => {
      console.error(`\n!!! Error creating network: ${err}\n`);
      return errorResponse(res, 'Error creating network', err);
    });
};

const createYamlFile = (req, res) => {
  const fileName = req.query.fileName || 'myYamlFile.yaml';
  const doc = yaml.safeDump(req.body);
  fs.writeFile(config.getDirUri() + fileName, doc, (err) => {
    if (err) {
      return errorResponse(res, `could not create file: ${fileName}`, err, 500);
    }
    return res.status(201).json({ "message": "YAML file created", path: config.getDirUri() + fileName });
  });
};

const exportPeerCertificates = (req, res) => {
  const orgName = req.query.orgName;
  const domain = req.query.domain;
  const peerName = req.params.peerName;

  return res.send(peerName);

  const downloadFileName = `${orgName}.${domain}.tar.gz`;

  helpers.exportPeerCertificates(orgName, domain, peerName)
    .then(resolve => {
      return res.status(200).download(config.getDirUri() + downloadFileName, downloadFileName);
    })
    .catch(err => {
      console.error(err);
      return errorResponse(res, `could not export ${orgName}.${domain}`, err, 500);
    });
};

const getYamlFile = (req, res) => {
  const fileName = req.query.fileName || 'myYamlFile.yaml';
  fs.readFile(config.getDirUri() + fileName, 'utf8', (err, data) => {
    if (err) {
      return errorResponse(res, `could not read file: ${fileName}`, err, 500);
    }
    const doc = yaml.safeLoad(data);
    return res.status(200).json({ "message": "Retrieved file", file: doc });
  });
};

const runCryptogen = (req, res) => {
  const fileName = req.query.fileName || 'crypto-config.yaml';
  const terminalCommand = `cd ${config.getDirUri()} && rm -rf crypto-config && cryptogen generate --config=${fileName}`;

  helpers.runTerminalCommand(terminalCommand)
    .then(output => {
      return res.status(201).json({ "message": "certificates generated", "path": config.getDirUri() });
    })
    .catch(err => {
      console.error(`\n!!! Error running Cryptogen: ${err}\n`);
      return errorResponse(res, 'Error running Cryptogen', err);
    });
};

const createDockerCompose = (req, res) => {
  const caDirectory = {};
  const peerDirectory = {};
  const ordererDirectory = {};
  dirToJson(config.getDirUri() + "crypto-config") // reading crypto-config library
    .then(dirTree => {
      const peerOrganizations = helpers.getPeerOrganizations(dirTree);
      const ordererOrganizations = helpers.getOrdererOrganizations(dirTree);

      let peerNames;
      if (peerOrganizations) peerNames = helpers.getNames(dirTree);

      let ordererNames;
      if (ordererOrganizations) ordererNames = helpers.getOrdererNames(dirTree);

      // Peer directory and CA directory
      if (peerOrganizations) {
        _.map(peerOrganizations, peer => {
          const files = helpers.getChildren(peer);
          _.map(files, item => {

            if (item.name == "ca") { // reading CA certificates
              caDirectory[peer.name] = [];
              _.map(item.children, specificCA => {
                caDirectory[peer.name].push(specificCA.name);
              });
            } else if (item.name == "peers") { // reading Peer certificates
              peerDirectory[peer.name] = [];
              _.map(item.children, specificPeer => {
                peerDirectory[peer.name].push(specificPeer.name);
              });
            }

          });
        });
      }

      // Orderer directory
      if (ordererOrganizations) {
        _.map(ordererOrganizations, orderer => {
          const files = helpers.getChildren(orderer);
          _.map(files, item => {
            if (item.name == "orderers") { // reading orderer certificates
              ordererDirectory[orderer.name] = [];
              _.map(item.children, specificOrderer => {
                ordererDirectory[orderer.name].push(specificOrderer.name);
              });
            }
          });
        });
      }

      const fileName = req.query.fileName || 'docker-compose.yaml';
      try {
        const doc = yaml.safeDump(helpers.getDockerComposeJSON(caDirectory, peerDirectory, ordererDirectory));
        fs.writeFileSync(config.getDirUri() + fileName, doc);
      } catch (err) {
        console.error(`\n!!! Error generating docker-compose.yaml: ${err}\n`);
        return errorResponse(res, 'Error generating docker-compose.yaml', err);
      }
      return res.status(201).json({ "message": "Docker-compose file is generated successfully!", path: config.getDirUri() + fileName });

    })
    .catch(err => {
      console.error(`\n!!! Error generating docker-compose.yaml: ${err}\n`);
      return errorResponse(res, 'Error generating docker-compose.yaml. Cannot parse directory structure', err);
    });
};


const errorResponse = (res, message, error, status = 500) =>
  res.status(status).json({ "status": status, "message": message, "error": error });



module.exports = {
  createAnchorPeerFile,
  createChannel,
  createDockerCompose,
  createGenesisBlock,
  createNetwork,
  createYamlFile,
  exportPeerCertificates,
  getYamlFile,
  runCryptogen
};
