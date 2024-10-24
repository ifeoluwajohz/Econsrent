const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { isEmail } = require('validator');
const argon2 = require('argon2');


const AgentSchema = new mongoose.Schema({
    name: {
        type: String,
        lowercase: true,
        trim: true
    },
    email: {
        unique: true,
        type: String,
        lowercase: true,
        validate: [isEmail, 'please enter a valid email']
    },
    password: {
        type: String,
        minlength: [8, 'Minimum password length is 8 characters']
    },
    otpCode: {
        type: String,
        default: null
    },
    otpExpiration: {  // Corrected 'default'
        type: Date,
        default: null
    },
    PropertyCreated: [{
        location: String,
        description: String,
        price: Number,
        stillAvailable: {
            type: Boolean,
            default: true
        },
        size: {
            type: String,
            enum: ['selfcontain', '2bedroomplat', '3bedroomplat'],
            lowercase: true
        },
    }]
});


AgentSchema.pre('save', async function (next) {
  const hash = await argon2.hash(this.password); // No need for salt generation
  this.password = hash;
  next();
});

// // static method to login user
AgentSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const auth = await argon2.verify(user.password, password); // Verify against stored hash
    if (auth) {
      return user;
    }
    throw Error('Incorrect password');
  }
  throw Error('Incorrect email');
};


const Agent = mongoose.model('agent', AgentSchema);
module.exports = Agent;