const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fixtureModel = new Schema({
  fixture: { type: String, required: true }
});

module.exports = mongoose.model('fixture', fixtureModel);
