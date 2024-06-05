const { PermissionsBitField, EmbedBuilder, ButtonBuilder, ButtonStyle,ActionRowBuilder } = require('discord.js');
const { exec } = require('child_process')

module.exports = {
    name: 'control',
    description: 'Stoppt oder startet den Bot neu.',
    
    callback: async (client,interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'Nur Administratoren können diesen Befehl verwenden.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('Bot-Kontrolle')
            .setDescription('Wähle eine Option aus:')
            .addFields(
                { name: 'Optionen', value: '1️⃣ Stop\n2️⃣ Neustart' }
            );

            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('stop_bot')
                    .setLabel('Stop')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('restart_bot')
                    .setLabel('Neustart')
                    .setStyle(ButtonStyle.Primary)
            );

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
};