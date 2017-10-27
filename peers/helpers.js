'use strict';

const { exec } = require('child_process');
const fs = require('fs');
const yaml = require('js-yaml');

const config = require('../config/');

const dirToJson = require('dir-to-json');
const _ = require('lodash');


const createPeer = (req, res) => {
  const fileName = req.query.fileName || 'docker-compose.yaml';
  exec(`cd ${config.getDirUri()} && docker-compose -f ${fileName} up -d`, (error, stdout, stderr) => {
    if (error) {
      console.error(`\n!!! docker-compose exec error: ${error}`);
      return res.status(500).json({ message: "Something went wrong. Check console" });
    }
    return res.status(201).json({ "message": "All peers are up and running" });
  });
};

const getChildren = dirTree => {
  return dirTree.children;
};


const getDockerComposeJSON = (caObject, peerObject, ordererObject) => {
  let dockerComposeJSON = {
    "version": "2",
    "services": {}
  };

  let ordererVolume = [];
  let OrdererRootCA = "";

  let caPort = 7054;
  _.forIn(caObject, function (value, key) {
    let ca = {
      "image": "hyperledger/fabric-ca:x86_64-1.0.0",
      "environment": [
        "FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server",
        "FABRIC_CA_SERVER_CA_KEYFILE=/etc/hyperledger/fabric-ca-server-config/" + value[0],
        "FABRIC_CA_SERVER_CA_CERTFILE=/etc/hyperledger/fabric-ca-server-config/" + value[1],
        "FABRIC_CA_SERVER_TLS_ENABLED=true",
        "FABRIC_CA_SERVER_TLS_KEYFILE=/etc/hyperledger/fabric-ca-server-config/" + value[0],
        "FABRIC_CA_SERVER_TLS_CERTFILE=/etc/hyperledger/fabric-ca-server-config/" + value[1]
      ],
      "ports": [
        caPort.toString() + ":7054"
      ],
      "command": 'sh -c "fabric-ca-server start -b admin:adminpw -d" ',
      "volumes": [
        "./crypto-config/peerOrganizations/" + key + "/ca/:/etc/hyperledger/fabric-ca-server-config"
      ],
      "container_name": "ca_peerOrg1"
    };
    caPort += 1000;
    dockerComposeJSON.services["ca." + key] = ca;
  });

  let peerRequestPort = 7051;
  let peerEventPort = 7053;
  _.forIn(peerObject, function (value, key) {
    _.map(value, function (peername) {
      let peer = {
        "container_name": peername,
        "extends": {
          "file": "base.yaml",
          "service": "peer-base"
        },
        "environment": [
          "CORE_PEER_ID=" + peername,
          "CORE_PEER_LOCALMSPID=pslloanMSP",
          "CORE_PEER_ADDRESS=" + peername + ":7051"
        ],
        "ports": [
          peerRequestPort.toString() + ":7051",
          peerEventPort.toString() + ":7053"
        ],
        "volumes": [
          "./crypto-config/peerOrganizations/" + key + "/peers/" + peername + "/:/etc/hyperledger/crypto/peer"
        ]
      };
      dockerComposeJSON.services[peername] = peer;
      peerRequestPort += 1000;
      peerEventPort += 1000;
      ordererVolume.push("./crypto-config/peerOrganizations/" + key + "/peers/" + peername + "/:/etc/hyperledger/crypto/peerOrg" + (ordererVolume.length + 1));
      OrdererRootCA += ",/etc/hyperledger/crypto/peerOrg" + (ordererVolume.length) + "/tls/ca.crt";
    });
  });

  let ordererPort = 7050;
  _.forIn(ordererObject, function (value, key) {
    _.map(value, function (orderername) {
      let orderer = {
        "container_name": orderername,
        "image": "hyperledger/fabric-orderer:x86_64-1.0.0",
        "environment": [
          "ORDERER_GENERAL_LOGLEVEL=debug",
          "ORDERER_GENERAL_LISTENADDRESS=0.0.0.0",
          "ORDERER_GENERAL_GENESISMETHOD=file",
          "ORDERER_GENERAL_GENESISFILE=/etc/hyperledger/configtx/genesis.block",
          "ORDERER_GENERAL_LOCALMSPID=OrdererMSP",
          "ORDERER_GENERAL_LOCALMSPDIR=/etc/hyperledger/crypto/orderer/msp",
          "ORDERER_GENERAL_TLS_ENABLED=true",
          "ORDERER_GENERAL_TLS_PRIVATEKEY=/etc/hyperledger/crypto/orderer/tls/server.key",
          "ORDERER_GENERAL_TLS_CERTIFICATE=/etc/hyperledger/crypto/orderer/tls/server.crt",
          "ORDERER_GENERAL_TLS_ROOTCAS=[/etc/hyperledger/crypto/orderer/tls/ca.crt" + OrdererRootCA + "]"
        ],
        "working_dir": "/opt/gopath/src/github.com/hyperledger/fabric/orderers",
        "command": "orderer",
        "ports": [
          ordererPort.toString() + ":7050"
        ],
        "volumes": _.concat(ordererVolume, ["./channel:/etc/hyperledger/configtx", "./crypto-config/ordererOrganizations/" + key + "/orderers/" + orderername + "/:/etc/hyperledger/crypto/orderer"])
      };

      dockerComposeJSON.services[orderername] = orderer;
      ordererPort += 1000;
    });
  });
  return dockerComposeJSON;
};

const getNames = dirTree => {
  const response = [];
  getPeerOrganizations(dirTree).forEach(function (element) {
    response.push(element.name);
  }, this);
  return response;
};

const getOrdererNames = dirTree => {
  let response = [];
  getOrdererOrganizations(dirTree).forEach(function (element) {
    response.push(element.name);
  }, this);
  return response;
};

const getOrdererOrganizations = dirTree => {
  let OrdererTree;
  _.map(dirTree.children, function (ordererElement) {
    if (ordererElement.name == ('ordererOrganizations')) {
      OrdererTree = ordererElement.children;
    }
  });

  return OrdererTree;
};

const getPeerOrganizations = dirTree => {
  let peerTree;
  _.map(dirTree.children, function (peerElement) {
    if (peerElement.name == ('peerOrganizations')) {
      peerTree = peerElement.children;
    }
  });

  return peerTree;
};

module.exports = {
  createPeer,
  getChildren,
  getDockerComposeJSON,
  getNames,
  getOrdererNames,
  getOrdererOrganizations,
  getPeerOrganizations
};
