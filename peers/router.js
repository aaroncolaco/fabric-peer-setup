'use strict';

const express = require('express');
const router = express.Router();

const controller = require('./controller');

router.post('/', controller.createPeer);

router.post('/crypto-config', controller.createCryptoConfig);

module.exports = router;
