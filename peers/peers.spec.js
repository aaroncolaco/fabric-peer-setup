'use strict';

const bin = require('../bin/www');
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

chai.use(chaiHttp);

const config = require('../config');

const hostURL = config.getURL();
const apiRootURL = '/api/peers';
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
      "orderer.kyc.com:7050"
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
      "MSPDir": "crypto-config/ordererOrganizations/kyc.com/msp"
    },
    {
      "Name": "pslloanMSP",
      "ID": "pslloanMSP",
      "MSPDir": "crypto-config/peerOrganizations/pslloan.kyc.com/msp",
      "AnchorPeers": [
        {
          "Host": "peer0.pslloan.kyc.com",
          "Port": 7051
        }
      ]
    },
    {
      "Name": "pslbankMSP",
      "ID": "pslbankMSP",
      "MSPDir": "crypto-config/peerOrganizations/pslbank.kyc.com/msp",
      "AnchorPeers": [
        {
          "Host": "peer0.pslbank.kyc.com",
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
          "orderer.kyc.com:7050"
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
            "MSPDir": "crypto-config/ordererOrganizations/kyc.com/msp"
          }
        ]
      },
      "Consortiums": {
        "SampleConsortium": {
          "Organizations": [
            {
              "Name": "pslloanMSP",
              "ID": "pslloanMSP",
              "MSPDir": "crypto-config/peerOrganizations/pslloan.kyc.com/msp",
              "AnchorPeers": [
                {
                  "Host": "peer0.pslloan.kyc.com",
                  "Port": 7051
                }
              ]
            },
            {
              "Name": "pslbankMSP",
              "ID": "pslbankMSP",
              "MSPDir": "crypto-config/peerOrganizations/pslbank.kyc.com/msp",
              "AnchorPeers": [
                {
                  "Host": "peer0.pslbank.kyc.com",
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
            "Name": "pslloanMSP",
            "ID": "pslloanMSP",
            "MSPDir": "crypto-config/peerOrganizations/pslloan.kyc.com/msp",
            "AnchorPeers": [
              {
                "Host": "peer0.pslloan.kyc.com",
                "Port": 7051
              }
            ]
          },
          {
            "Name": "pslbankMSP",
            "ID": "pslbankMSP",
            "MSPDir": "crypto-config/peerOrganizations/pslbank.kyc.com/msp",
            "AnchorPeers": [
              {
                "Host": "peer0.pslbank.kyc.com",
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
  describe('POST ' + apiRootURL, () => {
    it('response status should be 201', (done) => {
      chai.request(completeURL)
        .post('')
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res).to.be.an('object');
          done();
        });
    });
  });

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
        .send(cryptoConfigJSON)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res).to.be.an('object');
          expect(res.body).to.have.property('path');
          done();
        });
    });
  });
});
