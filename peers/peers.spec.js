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
});
