'use strict';

const createPeer = (req, res) => {
  return res.status(201).json({"message": "Peer created"});
};


module.exports = {
  createPeer
};
