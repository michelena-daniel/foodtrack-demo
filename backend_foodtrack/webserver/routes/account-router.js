'use strict';

const express = require('express');
const createAccount = require('../controllers/account/create-account');

const accountRouter = express.Router();

accountRouter.post('/account', createAccount);

module.exports = accountRouter;