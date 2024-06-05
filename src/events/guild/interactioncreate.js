const { Client, IntentsBitField } = require("discord.js"); 
const ticketResponse = require('../ticket/ticketresponse'); 
const ticketAction = require('../ticket/ticketaction');


const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.GuildPresences,
        IntentsBitField.Flags.GuildMessageReactions,
    ]
});

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.callback(client, interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId === 'verify_button') {
            await verifybutton.execute(interaction); // Handle verify button interaction
        } else if (interaction.customId.startsWith('verify')) {
            await ticketResponse.execute(interaction); // Handle ticket response
        } else {
            await ticketAction.execute(client, interaction); // Handle ticket action
        }
    }
});