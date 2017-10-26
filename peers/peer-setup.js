'use strict';

const { exec } = require('child_process');
const fs = require('fs');
const yaml = require('js-yaml');

const config = require('../config/');

var dirToJson = require('dir-to-json');
var _ = require('lodash');


//helper fucntions
const getPeerOrganizations = (dirTree) => {
    var peerTree;
    _.map(dirTree.children, function (peerElement) {
        if (peerElement.name == ('peerOrganizations')) {
            peerTree = peerElement.children;
        }
    });

    return peerTree;
}
const getOrdererOrganizations = (dirTree) => {
    var OrdererTree;
    _.map(dirTree.children, function (ordererElement) {
        if (ordererElement.name == ('ordererOrganizations')) {
            OrdererTree = ordererElement.children;
        }
    });

    return OrdererTree;
}
const getNames = (dirTree) => {
    var response = [];
    getPeerOrganizations(dirTree).forEach(function (element) {
        response.push(element.name);
    }, this);
    return response;
}

const getOrdererNames = (dirTree) => {
    var response = [];
    getOrdererOrganizations(dirTree).forEach(function (element) {
        response.push(element.name);
    }, this);
    return response;
}

const getChildren = (dirTree) => {
    return dirTree.children;
}

const getDockerComposeJSON = (caObject, peerObject, ordererObject) => {
    var dockerComposeJSON = {
        "version": "2",
        "services": {

        }
    };

    var ordererVolume = [];
    var OrdererRootCA = "";
    
    var caPort = 7054;
    _.forIn(caObject, function (value, key) {
        var ca = {
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
        }
        caPort += 1000;
        dockerComposeJSON.services["ca." + key] = ca;
    });

    var peerRequestPort = 7051;
    var peerEventPort = 7053;
    _.forIn(peerObject, function (value, key) {
        _.map(value, function (peername) {
            var peer = {
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
            }
            dockerComposeJSON.services[peername] = peer;
            peerRequestPort += 1000;
            peerEventPort += 1000;
            ordererVolume.push("./crypto-config/peerOrganizations/" + key + "/peers/" + peername + "/:/etc/hyperledger/crypto/peerOrg" + (ordererVolume.length + 1));
            OrdererRootCA += ",/etc/hyperledger/crypto/peerOrg" + (ordererVolume.length) + "/tls/ca.crt";
        });
    });

    var ordererPort = 7050;
    _.forIn(ordererObject, function (value, key) {
        _.map(value, function (orderername) {
            var orderer = {
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
            }
            dockerComposeJSON.services[orderername] = orderer;
            ordererPort += 1000;
        });
    });

    return dockerComposeJSON;
}

const generateFile = (req, res) => {
    var caDirectory = {};
    var peerDirectory = {};
    var ordererDirectory = {};
    dirToJson(config.getDirUri() + "crypto-config") // reading crypto-config library
        .then(function (dirTree) {
            var peerOrganizations = getPeerOrganizations(dirTree);
            var ordererOrganizations = getOrdererOrganizations(dirTree);
            var peerNames = getNames(dirTree);
            var ordererNames = getOrdererNames(dirTree);

            // Peer directory and CA directory 
            _.map(peerOrganizations, function (peer) {
                var files = getChildren(peer);
                _.map(files, function (item) {

                    if (item.name == "ca") { // reading CA certificates
                        caDirectory[peer.name] = [];
                        _.map(item.children, function (specificCA) {
                            caDirectory[peer.name].push(specificCA.name)
                        });
                    };

                    if (item.name == "peers") { // reading Peer certificates
                        peerDirectory[peer.name] = [];
                        _.map(item.children, function (specificPeer) {
                            peerDirectory[peer.name].push(specificPeer.name)
                        });
                    };

                });
            });
            
            // Orderer directory
            _.map(ordererOrganizations, function (orderer) {
                var files = getChildren(orderer);
                _.map(files, function (item) {
                    if (item.name == "orderers") { // reading orderer certificates
                        ordererDirectory[orderer.name] = [];
                        _.map(item.children, function (specificOrderer) {
                            ordererDirectory[orderer.name].push(specificOrderer.name)
                        });
                    };
                });
            });


            const fileName = req.query.fileName || 'docker-compose.yaml';
            try {
                const doc = yaml.safeDump(getDockerComposeJSON(caDirectory, peerDirectory, ordererDirectory));
                fs.writeFileSync(config.getDirUri() + fileName, doc);
            } catch (e) {
                console.log(e)
                return res.status(500).json({ "message": "Docker-compose file creation failed!", data: e.toString()  });    
            }
            var dockerComposeJSON = getDockerComposeJSON(caDirectory, peerDirectory, ordererDirectory);
            return res.status(201).json({ "message": "Docker-compose file is generated successfully!",  data: dockerComposeJSON });

        })
        .catch(function (err) {
            throw err;
        });

};

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



module.exports = {
    createPeer,
    generateFile,
};
