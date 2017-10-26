'use strict';

const express = require('express');
const router = express.Router();

const controller = require('./controller');
const peer = require('./peer-setup');

router.post('/', controller.createPeer);

// specify `?channel` & `?profileName`
router.post('/anchor-peer-file', controller.createAnchorPeerFile);

// specify `?channel` & `?profileName`
router.post('/channel', controller.createChannel);

// specify `?fileName`
router.post('/cryptogen-generate', controller.runCryptogen);

// specify `?fileName`
router.get('/yaml-file', controller.getYamlFile);
router.post('/yaml-file', controller.createYamlFile);

// specify `?profileName`
router.post('/genesis-block', controller.createGenesisBlock);

router.post('/create-peer', peer.createPeer);

router.post('/generate-file', peer.generateFile);

module.exports = router;
