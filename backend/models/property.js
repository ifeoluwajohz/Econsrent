const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  price: Number,
  imageKey: [String], // Change to array to hold multiple image keys
  location: {
    type: String,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    lowercase: true,
  },
  size: {
    type: String,
    enum: ['selfcontain', '2bedroomplat', '3bedroomplat'],
    lowercase: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent'
  },
  status: {
    type: String,
    enum: ['available', 'sold', 'rented']
  },
  dateCreated: {
    type: Date,
    default: Date.now // Automatically set date created to now
  }
});

const Property = mongoose.model('Property', PropertySchema);
module.exports = Property;
