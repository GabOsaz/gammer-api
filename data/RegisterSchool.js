const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RegisterSchoolModel = new Schema({
  gameMasterFirstName: { type: String, required: true },
  gameMasterLastName: { type: String, required: true },
  schoolName: { type: String, required: true },
  state: { type: String, required: true },
  yearFounded: { type: Number, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  accepted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('registeredSchool', RegisterSchoolModel);
