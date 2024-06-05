const mongoose = require('mongoose');
const Ticket = require('../models/ticket'); // Adjust the path to your schema

async function createTicket(guildId, channelId, memberId, type, ticketId) {
    console.log(`Creating ticket with ChannelId: ${channelId}, MemberID: ${memberId}`);
    
    const newTicket = new Ticket({
        GuildID: guildId,
        ChannelId: channelId,  // Ensure consistent field name
        MemberID: memberId,
        Type: type,
        TicketID: ticketId,
        Closed: false,
        Locked: false
    });

    await newTicket.save();
    console.log('Ticket saved:', newTicket);
}

// Example usage
client.on('messageCreate', async message => {
    if (message.content.startsWith('!createTicket')) {
        const channelId = message.channel.id;
        const guildId = message.guild.id;
        const memberId = message.author.id;
        const type = 'support'; // Example type
        const ticketId = `${channelId}-${Date.now()}`; // Example ticket ID

        await createTicket(guildId, channelId, memberId, type, ticketId);
        message.channel.send('Ticket created!');
    }
});