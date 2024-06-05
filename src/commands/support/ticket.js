const {EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle,PermissionFlagsBits, ActionRow} = require("discord.js");
const {openticket} = require("../../../config.json");

module.exports = {
    name: "ticket",
    description: "Open a ticket",
    Permissions: PermissionFlagsBits.ManageChannels,

    callback: async (client, interaction) => {
        const { guild } = interaction;

        const embed = new EmbedBuilder()
            .setDescription("open a ticket")

        const button = new ActionRowBuilder().setComponents(
            new ButtonBuilder().setCustomId("member").setLabel("😭Report member").setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId("bug").setLabel("🐞Report bug").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("config").setLabel("💻Code support").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("other").setLabel("Other support").setStyle(ButtonStyle.Success),

        );

        await guild.channels.cache.get(openticket).send({
            embeds: [embed],
            components: [button],

        });

        interaction.reply({content: "Ticket message has been sent", ephemeral: true});

    }
}