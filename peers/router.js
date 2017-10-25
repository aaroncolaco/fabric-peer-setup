'use strict';

const express = require('express');
const router = express.Router();

const controller = require('./controller');

router.post('/', controller.createPeer);

// specify `?fileName`
router.post('/cryptogen-generate', controller.runCryptogen);

// specify `?fileName`
router.post('/yaml-file', controller.createYamlFile);

module.exports = router;
