'use strict';

const express = require('express');
const router = express.Router();
const multer = require('multer');

const config = require('../config/');
const controller = require('./controller');

const storage = multer.diskStorage({
  destination: config.getDirUri(),
  filename: (req, file, callback) => callback(null, file.originalname)
});

const upload = multer({ storage: storage });


// middleware to allow CORS
router.use((req, res, next) => {
  var origin = req.headers.origin;

  res.setHeader('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', true);
  next();
});

router.post('/', controller.createNetwork);

router.get('/stats', controller.getSystemStats);

// export peer credentials
// `?domain`
router.get('/peer/:peerName', controller.exportPeerCertificates);

// Retrieve yaml file as JSON
router.get('/yaml-file', controller.getYamlFile);

// Generate files
// `?channel` & `?profileName`
router.post('/anchor-peer-file', controller.createAnchorPeerFile);
// `?channel` & `?profileName`
router.post('/channel', controller.createChannel);
// `?fileName`
router.post('/cryptogen-generate', controller.runCryptogen);
// generates by reading filesystem
router.post('/docker-compose', controller.createDockerCompose);
// `?profileName`
router.post('/genesis-block', controller.createGenesisBlock);
// `?fileName`
router.post('/yaml-file', controller.createYamlFile);


// import other org's peer credentials
router.post('/org/:orgName', upload.single('file'), controller.importOrgPeerCertificates);

module.exports = router;
