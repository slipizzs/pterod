const { Schema, model } = require("mongoose");

// Definiere das Verify-Schema
const verifySchema = new Schema({
    GuildID: String,
    MemberID: String,
    ChannelID: String,
    RoleID: String,
    MessageID: String,
    Type: String,
    IsActive: { type: Boolean, default: true }, // Verwende Boolean als Typ und setze den Standardwert auf true
    VerifiedAt: { type: Date, default: Date.now },
});

// Erstelle das Verify-Modell und exportiere es
module.exports = model("Verify", verifySchema);