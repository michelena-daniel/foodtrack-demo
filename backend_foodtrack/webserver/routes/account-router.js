'use strict';

const express = require('express');
const createAccount = require('../controllers/account/create-account');

const accountRouter = express.Router();

// metodos relacionados con account crear el verifyCode
accountRouter.post('/account', createAccount);

// activationCode buscar el account en mongo y añadirle el campo verifyAt con la fecha
accountRouter.post('/account/activate', createAccount);


module.exports = accountRouter;