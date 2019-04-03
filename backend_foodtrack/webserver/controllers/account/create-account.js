'use strict';

const bcrypt = require('bcrypt');
const Joi = require('joi');
const sendgridMail = require('@sendgrid/mail');
const uuidV4 = require('uuid/v4');
const AccountModel = require('../../../models/account-model');
const UserModel = require('../../../models/user-model');

sendgridMail.setApiKey(process.env.SENDGRID_API_KEY);

async function insertAccountIntoDatabase(email, password) {
  const securePassword = await bcrypt.hash(password, 10);
  const uuid = uuidV4();
  const now = new Date();
  const createdAt = now.toISOString().substring(0, 19).replace('T', ' ');

  console.log('secure password', securePassword);
  console.log('createdAt', createdAt);
  console.log('uuid', uuid);

  const data = {
    uuid: uuid,
    email: String,
    password: String,
    createdAt: createdAt,
    verificationCode: String,
    // verified_at: ???
  };

  try {
    await AccountModel.create(data);

    return uuid;

  } catch (e) {
    return res.status(500).send(e.message);
  }
}

async function validate(payload) {
    const schema = {
        email: Joi.string().email({ minDomainAtoms: 2 }).required(),
        password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required()
    };
  
    return Joi.validate(payload, schema);
  }

  async function createUserProfile(uuid) {
    const userProfileData = {
      uuid,
      avatarUrl: null,
      fullName: null,
      friends: [],
      preferences: {
        isPublicProfile: false,
        linkedIn: null,
        twitter: null,
        instagram: null,
        description: null,
      },
    };
  
    try {
      const userCreated = await UserModel.create(userProfileData);
  
      console.log(userCreated);
    } catch (e) {
      console.error(e);
    }
  }

  async function sendEmailRegistration(userEmail, verificationCode) {
    const msg = {
      to: userEmail,
      from: {
        email: 'foodtrack@yopmail.com',
        name: 'FoodTrack Services',
      },
      subject: 'Welcome to FoodTrack! :)',
      text: 'Start eating healthy and maintaining an extensive record of what you eat.',
      html: `To confirm the account <a href="${process.env.HTTP_SERVER_DOMAIN}/api/account/activate?verification_code=${verificationCode}">activate it here</a>`,
    };
  
    const data = await sendgridMail.send(msg);
  
    return data;
  }

  async function addVerificationCode(uuid) {
    const verificationCode = uuidV4();
    const now = new Date();
    const verifiedAt = now.toISOString().substring(0, 19).replace('T', ' ');
    
    //insert the verification code in mongo and send the status, return the code

    try {
      const filter = {
        uuid,
      };
      const operation = {
        $addToSet: {
          verificationCode: verificationCode,
          verified_at: verifiedAt,
        },
      };
  
      await AccountModel.findOneAndUpdate(filter, operation, options);
  
      return (res.status(201).send('Verificacion creada'), verificationCode);
    } catch (e) {
      return res.status(500).send(e.message);
    }
  }

  async function createAccount(req, res, next) {
    const accountData = { ...req.body };
  
    // Validate user data or send 400 bad request err

    try {
      await validate(accountData);
    } catch (e) {
      // Create validation error
      return res.status(400).send(e);
    }
  
    const {
      email,
      password,
    } = accountData;
  
    try {
      // Create the account and send the OK response
      
      const uuid = await insertAccountIntoDatabase(email, password);
      res.status(204).json();      
  
      /**
       * We are going to create a minimum structure in mongodb
       */

      await createUserProfile(uuid);      
  
      // Generate verification code and send email
       
      try {
        
        const verificationCode = await addVerificationCode(uuid);

        await sendEmailRegistration(email, verificationCode);
        
      } catch (e) {
        console.error('Sengrid error', e);
      }
    } catch (e) {
      // create error
      next(e);      
    }
  }

  module.exports = createAccount;