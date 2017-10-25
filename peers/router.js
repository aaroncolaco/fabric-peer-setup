'use strict';

const express = require('express');
const router = express.Router();

const controller = require('./controller');

router.post('/', controller.createPeer);

// specify `?channel` & `?profileName`
router.post('/anchor-peer-file', controller.createAnchorPeerFile);

// specify `?channel` & `?profileName`
router.post('/channel', controller.createChannel);

// specify `?fileName`
router.post('/cryptogen-generate', controller.runCryptogen);

// specify `?fileName`
router.post('/yaml-file', controller.createYamlFile);

// specify `?profileName`
router.post('/genesis-block', controller.createGenesisBlock);

module.exports = router;
