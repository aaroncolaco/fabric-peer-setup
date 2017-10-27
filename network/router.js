'use strict';

const express = require('express');
const router = express.Router();

const controller = require('./controller');

router.post('/', controller.createNetwork);

// specify `?channel` & `?profileName`
router.post('/anchor-peer-file', controller.createAnchorPeerFile);

// specify `?channel` & `?profileName`
router.post('/channel', controller.createChannel);

// specify `?fileName`
router.post('/cryptogen-generate', controller.runCryptogen);

// generates by reading filesystem
router.post('/docker-compose', controller.createDockerCompose);

// specify `?profileName`
router.post('/genesis-block', controller.createGenesisBlock);

// specify `?fileName`
router.get('/yaml-file', controller.getYamlFile);
router.post('/yaml-file', controller.createYamlFile);

module.exports = router;
