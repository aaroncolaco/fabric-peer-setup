'use strict';

const bin = require('../bin/www');
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

chai.use(chaiHttp);

const config = require('../config');

const hostURL = config.getURL();
const apiRootURL = '/api/network';
const completeURL = hostURL + apiRootURL;

const cryptoConfigJSON = {
  "OrdererOrgs": [
    {
      "Name": "Orderer",
      "Domain": "example.com",
      "Specs": [
        {
          "Hostname": "orderer"
        }
      ]
    }
  ],
  "PeerOrgs": [
    {
      "Name": "Org1",
      "Domain": "org1.example.com",
      "Template": {
        "Count": 2
      },
      "Users": {
        "Count": 1
      }
    },
    {
      "Name": "Org2",
      "Domain": "org2.example.com",
      "Template": {
        "Count": 2
      },
      "Users": {
        "Count": 1
      }
    }
  ]
};

const configTxJSON = {
  "Orderer": {
    "OrdererType": "solo",
    "Addresses": [
      "orderer.example.com:7050"
    ],
    "BatchTimeout": "2s",
    "BatchSize": {
      "MaxMessageCount": 10,
      "AbsoluteMaxBytes": "98 MB",
      "PreferredMaxBytes": "512 KB"
    },
    "Kafka": {
      "Brokers": [
        "127.0.0.1:9092"
      ]
    },
    "Organizations": null
  },
  "Application": {
    "Organizations": null
  },
  "Organizations": [
    {
      "Name": "OrdererMSP",
      "ID": "OrdererMSP",
      "MSPDir": "crypto-config/ordererOrganizations/example.com/msp"
    },
    {
      "Name": "Org1",
      "ID": "Org1",
      "MSPDir": "crypto-config/peerOrganizations/example.com/msp",
      "AnchorPeers": [
        {
          "Host": "peer0.org1.example.com",
          "Port": 7051
        }
      ]
    },
    {
      "Name": "Org2",
      "ID": "Org2",
      "MSPDir": "crypto-config/peerOrganizations/example.com/msp",
      "AnchorPeers": [
        {
          "Host": "peer0.org2.example.com",
          "Port": 7051
        }
      ]
    }
  ],
  "Profiles": {
    "TwoOrgsOrdererGenesis": {
      "Orderer": {
        "OrdererType": "solo",
        "Addresses": [
          "orderer.example.com:7050"
        ],
        "BatchTimeout": "2s",
        "BatchSize": {
          "MaxMessageCount": 10,
          "AbsoluteMaxBytes": "98 MB",
          "PreferredMaxBytes": "512 KB"
        },
        "Kafka": {
          "Brokers": [
            "127.0.0.1:9092"
          ]
        },
        "Organizations": [
          {
            "Name": "OrdererMSP",
            "ID": "OrdererMSP",
            "MSPDir": "crypto-config/ordererOrganizations/example.com/msp"
          }
        ]
      },
      "Consortiums": {
        "SampleConsortium": {
          "Organizations": [
            {
              "Name": "Org1",
              "ID": "Org1",
              "MSPDir": "crypto-config/peerOrganizations/org1.example.com/msp",
              "AnchorPeers": [
                {
                  "Host": "peer0.org1.example.com",
                  "Port": 7051
                }
              ]
            },
            {
              "Name": "Org2",
              "ID": "Org2",
              "MSPDir": "crypto-config/peerOrganizations/org2.example.com/msp",
              "AnchorPeers": [
                {
                  "Host": "peer0.org2.example.com",
                  "Port": 7051
                }
              ]
            }
          ]
        }
      }
    },
    "TwoOrgsChannel": {
      "Consortium": "SampleConsortium",
      "Application": {
        "Organizations": [
          {
            "Name": "Org1",
            "ID": "Org1",
            "MSPDir": "crypto-config/peerOrganizations/org1.example.com/msp",
            "AnchorPeers": [
              {
                "Host": "peer0.org1.example.com",
                "Port": 7051
              }
            ]
          },
          {
            "Name": "Org2",
            "ID": "Org2",
            "MSPDir": "crypto-config/peerOrganizations/org2.example.com/msp",
            "AnchorPeers": [
              {
                "Host": "peer0.org2.example.com",
                "Port": 7051
              }
            ]
          }
        ]
      }
    }
  }
};

describe('Peer Config Files Tests', () => {
  describe('POST ' + apiRootURL + '/yaml-file?fileName=crypto-config.yaml', () => {
    it('create `cryto-config.yaml`', (done) => {
      chai.request(completeURL)
        .post('/yaml-file?fileName=crypto-config.yaml')
        .send(cryptoConfigJSON)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res).to.be.an('object');
          expect(res.body).to.have.property('path');
          done();
        });
    });
  });

  describe('GET ' + apiRootURL + '/yaml-file?fileName=crypto-config.yaml', () => {
    it('read `crypto-config.yaml`', (done) => {
      chai.request(completeURL)
        .get('/yaml-file?fileName=crypto-config.yaml')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.an('object');
          expect(res.body).to.have.property('file');
          expect(res.body.file).to.deep.equal(cryptoConfigJSON);
          done();
        });
    });
  });

  describe('POST ' + apiRootURL + '/cryptogen-generate', () => {
    it('cryptogen generate certificates from `crypto-config.yaml`', (done) => {
      chai.request(completeURL)
        .post('/cryptogen-generate?fileName=crypto-config.yaml')
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res).to.be.an('object');
          expect(res.body).to.have.property('path');
          done();
        });
    });
  });

  describe('POST ' + apiRootURL + '/yaml-file?fileName=configtx.yaml', () => {
    it('create `configtx.yaml`', (done) => {
      chai.request(completeURL)
        .post('/yaml-file?fileName=configtx.yaml')
        .send(configTxJSON)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res).to.be.an('object');
          expect(res.body).to.have.property('path');
          done();
        });
    });
  });

  describe('GET ' + apiRootURL + '/yaml-file?fileName=configtx.yaml', () => {
    it('read `configtx.yaml`', (done) => {
      chai.request(completeURL)
        .get('/yaml-file?fileName=configtx.yaml')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.an('object');
          expect(res.body).to.have.property('file');
          expect(res.body.file).to.deep.equal(configTxJSON);
          done();
        });
    });
  });

  describe('POST ' + apiRootURL + '/genesis-block', () => {
    it('configtxgen generate genesis block from `configtx.yaml`', (done) => {
      chai.request(completeURL)
        .post('/genesis-block?profileName=TwoOrgsOrdererGenesis')
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res).to.be.an('object');
          expect(res.body).to.have.property('path');
          done();
        });
    });
  });

  describe('POST ' + apiRootURL + '/channel', () => {
    it('configtxgen generate channel file from `configtx.yaml`', (done) => {
      chai.request(completeURL)
        .post('/channel?profileName=TwoOrgsChannel&channelName=SampleConsortium')
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res).to.be.an('object');
          expect(res.body).to.have.property('path');
          done();
        });
    });
  });

  describe('POST ' + apiRootURL + '/anchor-peer-file', () => {
    it('configtxgen generate anchor peer file from `configtx.yaml`', (done) => {
      chai.request(completeURL)
        .post('/anchor-peer-file?profileName=TwoOrgsChannel&channelName=SampleConsortium&orgName=Org1')
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res).to.be.an('object');
          expect(res.body).to.have.property('path');
          done();
        });
    });
  });

  describe('GET ' + apiRootURL + '/peer/peer0', () => {
    it('export peer cert', (done) => {
      chai.request(completeURL)
        .get('/peer/peer0?orgName=org1&domain=example.com')
        .end((err, res) => {
          expect(res).to.have.status(200);
          done();
        });
    });
  });

  describe('POST ' + apiRootURL + '/docker-compose', () => {
    it('generate docker-compose file', (done) => {
      chai.request(completeURL)
        .post('/docker-compose?fileName=docker-compose.yaml')
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res).to.be.an('object');
          expect(res.body).to.have.property('path');
          done();
        });
    });
  });

  // describe('POST ' + apiRootURL, () => {
  //   it('create the network', (done) => {
  //     chai.request(completeURL)
  //       .post('?fileName=docker-compose.yaml')
  //       .end((err, res) => {
  //         expect(res).to.have.status(201);
  //         expect(res).to.be.an('object');
  //         done();
  //       });
  //   });
  // });

});
