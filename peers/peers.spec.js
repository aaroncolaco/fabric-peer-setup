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

describe('Peer Tests', () => {
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

  describe('POST ' + apiRootURL + '/crypto-config', () => {
    it('response status should be 201', (done) => {
      chai.request(completeURL)
        .post('/crypto-config')
        .send(cryptoConfigJSON)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res).to.be.an('object');
          done();
        });
    });
  });

  describe('POST ' + apiRootURL + '/cryptogen-generate', () => {
    it('response status should be 201', (done) => {
      chai.request(completeURL)
        .post('/cryptogen-generate?fileName=crypto-config.yaml')
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res).to.be.an('object');
          done();
        });
    });
  });
});
