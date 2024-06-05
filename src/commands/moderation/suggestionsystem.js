const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const suggestionSchema = require("../../schemas/suggestions");

module.exports = {
    name: "suggestionsystem",
    description: "Setup the suggestion system",
    options: [
        {
            name: "configuration",
            description: "Configure the suggestion system",
            type: 1, // Subcommand type
            options: [
                {
                    name: "channel",
                    description: "The channel for suggestions",
                    type: 7, // CHANNEL type
                    required: true,
                },
            ],
        },
        {
            name: "manage",
            description: "Manage the suggestion system",
            type: 1, // Subcommand type
            options: [
                {
                    name: "action",
                    description: "Action to perform",
                    type: 3, // STRING type
                    required: true,
                    choices: [
                        { name: "Approve", value: "approve" },
                        { name: "Deny", value: "deny" },
                        { name: "Delete", value: "delete" },
                    ],
                },
                {
                    name: "message_id",
                    description: "The message ID of the suggestion",
                    type: 3, // STRING type
                    required: true,
                },
            ],
        },
    ],
    callback: async (client, interaction) => {
        const { options, guildId, guild, user } = interaction;
        const subcommand = options.getSubcommand();
        const rEmbed = new EmbedBuilder();

        if (subcommand === "configuration") {
            const channel = options.getChannel("channel");
            let schema = await suggestionSchema.findOne({ GuildID: guildId });

            if (!schema) {
                await suggestionSchema.create({
                    GuildID: guildId,
                    SuggestionSystem: { Channel: channel.id, suggestions: [] },
                });
                rEmbed
                    .setDescription(`Successfully set up the suggestions channel as <#${channel.id}>`)
                    .setColor("Green");

                return await interaction.reply({ embeds: [rEmbed], ephemeral: true });
            } else {
                if (schema.SuggestionSystem.Channel === channel.id) {
                    rEmbed
                        .setDescription(`The suggestions channel is already set to <#${channel.id}>`)
                        .setColor("Red");

                    return await interaction.reply({ embeds: [rEmbed], ephemeral: true });
                }

                schema.SuggestionSystem.Channel = channel.id;
                await schema.save().catch((err) => console.log(err));

                rEmbed
                    .setDescription(`Successfully set up the suggestions channel as <#${channel.id}>`)
                    .setColor("Green");

                return await interaction.reply({ embeds: [rEmbed], ephemeral: true });
            }
        } else if (subcommand === "manage") {
            const action = options.getString("action");
            const messageId = options.getString("message_id");

            const suggestionSchemaData = await suggestionSchema.findOne({ GuildID: guildId });
            if (!suggestionSchemaData) {
                rEmbed
                    .setDescription("Suggestion system not configured. Please configure it first.")
                    .setColor("Red");

                return await interaction.reply({ embeds: [rEmbed], ephemeral: true });
            }

            const suggestionChannelId = suggestionSchemaData.SuggestionSystem.Channel;
            const suggestionChannel = guild.channels.cache.get(suggestionChannelId);

            if (!suggestionChannel) {
                rEmbed
                    .setDescription("Suggestion channel not found. Please configure the suggestion system first.")
                    .setColor("Red");

                return await interaction.reply({ embeds: [rEmbed], ephemeral: true });
            }

            const suggestionMessage = await suggestionChannel.messages.fetch(messageId).catch(() => null);

            if (!suggestionMessage) {
                rEmbed
                    .setDescription("Suggestion message not found.")
                    .setColor("Red");

                return await interaction.reply({ embeds: [rEmbed], ephemeral: true });
            }

            if (action === "approve") {
                rEmbed
                    .setDescription(`Suggestion approved by ${user.tag}`)
                    .setColor("Green");

                await suggestionMessage.edit({ embeds: [rEmbed] });
                await interaction.reply({ content: "Suggestion approved.", ephemeral: true });
            } else if (action === "deny") {
                rEmbed
                    .setDescription(`Suggestion denied by ${user.tag}`)
                    .setColor("Red");

                await suggestionMessage.edit({ embeds: [rEmbed] });
                await interaction.reply({ content: "Suggestion denied.", ephemeral: true });
            } else if (action === "delete") {
                const thread = suggestionMessage.hasThread ? suggestionMessage.thread : null;
                await suggestionMessage.delete();
                if (thread) {
                    await thread.delete();
                }
                await interaction.reply({ content: "Suggestion deleted.", ephemeral: true });
            }
        }
    }
};