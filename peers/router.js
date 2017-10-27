'use strict';

const express = require('express');
const router = express.Router();

const controller = require('./controller');

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

router.post('/docker-compose', controller.createDockerCompose);

router.post('/network', controller.createNetwork);

module.exports = router;
