const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userModel = new Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
});

module.exports = mongoose.model('user', userModel);
