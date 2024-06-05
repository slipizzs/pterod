const { ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");
const ticketSchema = require("../../models/ticket");
const { ticketParent, everyone } = require("../../../config.json");

module.exports = {
    name: "ticketresponse",

    async execute(interaction) {
        if (!interaction.isButton()) return;

        const { guild,channel, member, customId } = interaction;
        const { ViewChannel, SendMessages, ManageChannels, ReadMessageHistory } = PermissionFlagsBits;
        const ticketId = Math.floor(Math.random() * 9000) + 1000; // Correct ticket ID generation

        if (!["member", "bug", "config", "other"].includes(customId)) return;

        if (!guild.members.me.permissions.has(ManageChannels)) {
            return interaction.reply({ content: "I don't have permission to manage channels.", ephemeral: true });
        }

        try {
            const channel = await guild.channels.create({
                name: `${member.user.username}-ticket-${ticketId}`,
                type: ChannelType.GuildText,
                parent: ticketParent,
                permissionOverwrites: [
                    {
                        id: everyone,
                        deny: [ViewChannel, SendMessages, ReadMessageHistory],
                    },
                    {
                        id: member.id,
                        allow: [ViewChannel, SendMessages, ReadMessageHistory],
                    },
                ],
            });

            await ticketSchema.create({
                GuildID: guild.id,
                MemberID: member.id,
                ChannelID: channel.id,
                TicketID: ticketId,
                Type: customId,
                Closed: false,
                Locked: false,
            });

            const embed = new EmbedBuilder()
                .setTitle(`${guild.name} - Ticket: ${customId}`)
                .setDescription("Our team will contact you shortly. Please describe your problem.")
                .setFooter({ text: `${ticketId}`, iconURL: member.displayAvatarURL({ dynamic: true }) });

            const button = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("close").setLabel("Close Ticket").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("lock").setLabel("Lock Ticket").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("unlock").setLabel("Unlock Ticket").setStyle(ButtonStyle.Success),
            );

            await channel.send({
                embeds: [embed],
                components: [button],
            });

            await interaction.reply({ content: "Successfully created a ticket", ephemeral: true });
        } catch (err) {
            console.error(err);
            await interaction.reply({ content: "There was an error creating the ticket.", ephemeral: true });
        }
    }
};