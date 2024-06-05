const { ButtonInteraction, EmbedBuilder, PermissionsBitField } = require("discord.js");
const { createTranscript } = require("discord-html-transcripts");
const { transcript: transcriptChannelId } = require("../../../config.json");
const ticketSchema = require("../../models/ticket");

module.exports = {
    name: "ticketaction",

    async execute(client, interaction) {
        const { guild, member, customId, channel } = interaction;
        const { ManageChannels, SendMessages } = PermissionsBitField;

        if (!interaction.isButton()) return;

        if (!["close", "lock", "unlock"].includes(customId)) return;

        if (!guild.members.me.permissions.has(ManageChannels)) {
            return interaction.reply({ content: "I don't have the necessary permissions to manage channels.", ephemeral: true });
        }

        const embed = new EmbedBuilder().setColor("Aqua");

        try {
            const data = await ticketSchema.findOne({ ChannelID: channel.id });
            if (!data) return;

            const fetchedMember = await guild.members.cache.get(data.MemberID);

            switch (customId) {
                case "close":
                    if (data.Closed === true) {
                        return interaction.reply({ content: "Ticket is already being deleted..." });
                    }

                    const transcript = await createTranscript(channel, {
                        limit: -1,
                        returnBuffer: false,
                        filename: `${member.user.username}-ticket${data.Type}-${data.TicketID}.html`,
                    });

                    await ticketSchema.updateOne({ ChannelID: channel.id }, { Closed: true });

                    const transcriptEmbed = new EmbedBuilder()
                        .setTitle("Saving transcript...")
                        .setDescription("Ticket will be closed in 10 seconds. Enable DMs to receive the ticket transcript.")
                        .setColor("Red")
                        .setFooter({ text: member.user.tag, iconURL: member.displayAvatarURL({ dynamic: true }) })
                        .setTimestamp();

                    const res = await guild.channels.cache.get(transcriptChannelId).send({
                        embeds: [transcriptEmbed],
                        files: [transcript],
                    });

                    const transcriptProcessEmbed = new EmbedBuilder()
                        .setDescription(`Access your ticket transcript: ${res.url}`)
                        .setColor("Green");

                    channel.send({ embeds: [transcriptEmbed] });

                    setTimeout(async () => {
                        try {
                            await member.send({ embeds: [transcriptProcessEmbed] });
                        } catch {
                            channel.send("Couldn't send transcript to direct messages.");
                        }
                        channel.delete();
                    }, 10000);

                    break;

                case "lock":
                    if (!member.permissions.has(ManageChannels)) {
                        return interaction.reply({ content: "You don't have the necessary permissions to lock this ticket.", ephemeral: true });
                    }

                    if (data.Locked === true) {
                        return interaction.reply({ content: "Ticket is already locked.", ephemeral: true });
                    }

                    await ticketSchema.updateOne({ ChannelID: channel.id }, { Locked: true });
                    embed.setDescription("Ticket was locked successfully");

                    channel.permissionOverwrites.edit(fetchedMember, { SendMessages: false });

                    return interaction.reply({ embeds: [embed] });

                case "unlock":
                    if (!member.permissions.has(ManageChannels)) {
                        return interaction.reply({ content: "You don't have the necessary permissions to unlock this ticket.", ephemeral: true });
                    }

                    if (data.Locked === false) {
                        return interaction.reply({ content: "Ticket is already unlocked.", ephemeral: true });
                    }

                    await ticketSchema.updateOne({ ChannelID: channel.id }, { Locked: false });
                    embed.setDescription("Ticket was unlocked successfully");

                    channel.permissionOverwrites.edit(fetchedMember, { SendMessages: true });

                    return interaction.reply({ embeds: [embed] });
            }
        } catch (err) {
            console.error(err);
            interaction.reply({ content: "An error occurred while processing the ticket action.", ephemeral: true });
        }
    }
};