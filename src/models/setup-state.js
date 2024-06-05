const mongoose = require('mongoose');

const setupStateSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    categoryId: { type: String, required: true },
    channels: {
        memberCount: { type: String, required: true },
        botCount: { type: String, required: true },
        owner: { type: String, required: true },
        channelCount: { type: String, required: true },
        roleCount: { type: String, required: true }
    }
});

module.exports = mongoose.model('SetupState', setupStateSchema);