'use strict';

const mongoose = require('mongoose');

// create the schema

const { Schema } = mongoose; // same as const 'Schema = mongoose.Schema' without destructuring

const accountSchema = new Schema({
    uuid: {
        type: String,
        unique: true,
      },
    email: String,
    password: String,
    createdAt: Date, 
    verification: {
      verificationCode: String,
      verifiedAt: Date,
    },
  });

  //convert the schema to a model
  
  const Account = mongoose.model('Account', accountSchema);
module.exports = Account;


