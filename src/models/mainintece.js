const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  channelId: {
    type: String,
    required: true
  },
  maintenanceStatus: {
    type: Boolean,
    required: true
  }
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);