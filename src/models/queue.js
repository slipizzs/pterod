const {model,Schema} = require('mongoose');

const queueSchema = new Schema({
    guildId: String,
    songs: [
        {
            title: String,
            url: String,
        },
    ],
});

module.exports = model('Queue', queueSchema);