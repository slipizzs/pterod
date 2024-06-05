const { model, Schema } = require("mongoose");

let ticketSchema = new Schema({
    GuildID: String,
    MemberID: String,
    TicketID: String,
    ChannelID: String, // Ensure consistent field name
    Closed: Boolean,   // Use Boolean type
    Locked: Boolean,   // Use Boolean type
    Type: String,
});

module.exports = model("Ticket", ticketSchema);