const { PermissionsBitField, ChannelType, ApplicationCommandOptionType } = require('discord.js');
const schema = require('../../models/joint-to-create');

module.exports = {
    name: "jointocreate",
    description: "Set up a channel for users to join and create new channels",
    permissions: PermissionsBitField.Flags.Administrator,
    options: [
        {
            name: "channel",
            description: "The voice channel to use for the join-to-create system",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildVoice], // Specify the type of channel
            required: true
        },
        {
            name: "userlimit",
            description: "The user limit of the created channels",
            type: ApplicationCommandOptionType.Integer, // Use Integer for user limit
            minValue: 1,
            maxValue: 99,
            required: true
        }
    ],
    callback: async (client, interaction) => {
        const { guild, options } = interaction;
        const channel = options.getChannel("channel");
        const userLimit = options.getInteger("userlimit");

        if (!channel || channel.type !== ChannelType.GuildVoice) {
            return interaction.reply({ content: "Please provide a valid voice channel.", ephemeral: true });
        }

        try {
            let data = await schema.findOne({ Guild: guild.id });
            if (!data) {
                data = new schema({
                    Guild: guild.id,
                    Channel: channel.id,
                    UserLimit: userLimit,
                });
                await data.save();
                return interaction.reply({ content: "The join-to-create system has been set up successfully.", ephemeral: true });
            } else {
                data.Channel = channel.id;
                data.UserLimit = userLimit;
                await data.save();
                return interaction.reply({ content: "The join-to-create system has been updated successfully.", ephemeral: true });
            }
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: "An error occurred while setting up the join-to-create system.", ephemeral: true });
        }
    }
};