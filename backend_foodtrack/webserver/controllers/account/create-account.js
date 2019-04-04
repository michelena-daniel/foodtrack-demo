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



  const data = {
    uuid,
    email,
    password: securePassword,
    createdAt,
  };


  try{
    
    await AccountModel.create(data);
    return uuid;

  }catch(e){
    console.log("",e)

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

  async function sendEmailRegistration(userEmail, verificationCode ){
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
    const now = new Date();
    const verificationCode = uuidV4();
    const createdAt = now.toISOString().substring(0, 19).replace('T', ' ');
    
    //insert the verification code in mongo and send the status, return the code

    try {

      // update del account para meterle el campo verificationCode que es OBJETO
      const filter = {
        uuid,
      };
      
      const op = {
        $push: {
          verification: {
            verificationCode,
            createdAt,
            verifiedAt: null,
          },
        },
      };
  
      await AccountModel.findOneAndUpdate(filter, op);
  
      return verificationCode;

    } catch (e) {
      console.error(e)
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
      console.log("33333333333333333333333" + email + " " + password)
      const uuid = await insertAccountIntoDatabase(email, password);
      console.log("ALIBABA uuuuuuuuuuuid es -> ",uuid)
      res.status(204).json();      
  
      /**
       * We are going to create a minimum structure in mongodb
       */

      await createUserProfile(uuid);      
  
      // Generate verification code and send email
       
      try {
        
        const verificationCode = await addVerificationCode(uuid);

        await sendEmailRegistration(email, verificationCode);
        res.status(204).send()
      } catch (e) {
        console.error('Sengrid error', e);
      }
    } catch (e) {
      // create error
      next(e);      
    }
  }

  module.exports = createAccount;