const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const maintenance = require('../../server/maintenance');
const Maintenance = require('../../models/mainintece'); // Annahme des Modellnamens

let endTime = null;
let interval;

module.exports = {
    name: 'maintenance',
    description: 'Aktiviert oder deaktiviert den Wartungsmodus.',
    options: [
        {
            name: 'status',
            description: 'Aktiviert (on) oder deaktiviert (off) den Wartungsmodus.',
            type: 3, // String
            required: true,
            choices: [
                { name: 'On', value: 'on' },
                { name: 'Off', value: 'off' }
            ]
        },
        {
            name: 'time',
            description: 'Die Dauer des Wartungsmodus in Minuten.',
            type: 4, // Integer,
            required: true
        },
        {
            name: 'channel',
            description: 'Der Kanal, in dem die Benachrichtigung gesendet werden soll.',
            type: 7, // CHANNEL
            required: true
        }
    ],
    callback: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'Du benötigst Administratorberechtigungen, um diesen Befehl auszuführen.', ephemeral: true });
        }

        const status = interaction.options.getString('status');

        if (status === 'on') {
            const time = interaction.options.getInteger('time') || 0;
            const channel = interaction.options.getChannel('channel');

            if (time > 0) {
                endTime = new Date(Date.now() + time * 60000); // Endzeit berechnen
            } else {
                endTime = null;
            }

            maintenance.setMaintenanceMode(true);

            // Bot in DND setzen
            interaction.client.user.setPresence({ activities: [{ name: 'im Wartungsmodus', type: 5 }], status: 'dnd' });

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Wartungsmodus aktiviert')
                .setDescription(`Alle Befehle sind nun deaktiviert. ${endTime ? `Der Wartungsmodus wird in ${formatTime((endTime - Date.now()) / 1000)} automatisch deaktiviert.` : ''}`);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('pause_maintenance')
                        .setLabel('Pause')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('continue_maintenance')
                        .setLabel('Weiter')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('extend_maintenance')
                        .setLabel('+5 Minuten')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('stop_maintenance')
                        .setLabel('Stop')
                        .setStyle(ButtonStyle.Danger)
                );

            const reply = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

            const updateInterval = () => {
                if (endTime) {
                    const remainingTime = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));

                    if (remainingTime === 0) {
                        clearInterval(interval);
                        maintenance.setMaintenanceMode(false);
                        endTime = null;

                        const embedOff = new EmbedBuilder()
                            .setColor('#00FF00')
                            .setTitle('Wartungsmodus deaktiviert')
                            .setDescription('Alle Befehle sind nun wieder aktiviert.');

                        interaction.editReply({ embeds: [embedOff], components: [] });
                    } else {
                        const timeString = formatTime(remainingTime);
                        embed.setDescription(`Alle Befehle sind nun deaktiviert. Der Wartungsmodus wird in ${timeString} automatisch deaktiviert.`);
                        reply.edit({ embeds: [embed] });
                    }
                }
            };

            interval = setInterval(updateInterval, 1000);

            // Button Interaktion
            const collector = reply.createMessageComponentCollector({
                filter: i => i.member.permissions.has(PermissionsBitField.Flags.Administrator),
                time: time * 60000
            });

            collector.on('collect', async i => {
                switch (i.customId) {
                    case 'pause_maintenance':
                        clearInterval(interval);
                        await i.deferUpdate();
                        break;
                    case 'continue_maintenance':
                        interval = setInterval(updateInterval, 1000);
                        await i.deferUpdate();
                        break;
                    case 'extend_maintenance':
                        clearInterval(interval);
                        endTime = new Date(endTime.getTime() + 5 * 60000); // Verlängere um 5 Minuten
                        interval = setInterval(updateInterval, 1000);
                        await i.deferUpdate();
                        break;
                    case 'stop_maintenance':
                        clearInterval(interval);
                        maintenance.setMaintenanceMode(false);
                        endTime = null;
                        client.user.setPresence({ status: 'online', activities: [] }); // Setze den Bot-Status zurück
                        const embedOff = new EmbedBuilder()
                            .setColor('#00FF00')
                            .setTitle('Wartungsmodus deaktiviert')
                            .setDescription('Alle Befehle sind nun wieder aktiviert.');
                        await i.deferUpdate();
                        interaction.editReply({ embeds: [embedOff], components: [] });
                        break;
                    default:
                        break;
                }
            });

            // Benachrichtigungskanal setzen
           // Benachrichtigungskanal setzen
if (channel) {
    await Maintenance.findOneAndUpdate({}, { channelId: channel.id }, { upsert: true });
    const notificationChannel = interaction.guild.channels.cache.get(channel.id);
    if (notificationChannel) {
        const notificationEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('Wartungsmodus aktiviert')
            .setDescription(`Der Wartungsmodus wurde aktiviert. Alle Befehle sind nun deaktiviert. Der Wartungsmodus wird in ${formatTime((endTime - Date.now()) / 1000)} automatisch deaktiviert.`);

        const notificationMessage = await notificationChannel.send({ embeds: [notificationEmbed] });

        const updateEmbedInterval = setInterval(() => {
            const remainingTime = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
            if (remainingTime === 0) {
                clearInterval(updateEmbedInterval);
                const updatedEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('Wartungsmodus deaktiviert')
                    .setDescription('Der Wartungsmodus ist nun deaktiviert. Alle Befehle sind wieder verfügbar.');
                notificationMessage.edit({ embeds: [updatedEmbed] });
            } else {
                const updatedNotificationEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Wartungsmodus aktiviert 🔴')
                    .setDescription(`Der Wartungsmodus wurde aktiviert. Alle Befehle sind nun deaktiviert. Der Wartungsmodus wird in ${formatTime(remainingTime)} automatisch deaktiviert.`);
                notificationMessage.edit({ embeds: [updatedNotificationEmbed] });

                
            }
        }, 1000);
    }
}
        } else {
            maintenance.setMaintenanceMode(false);
            clearInterval(interval);
            endTime = null;
            client.user.setPresence({ status: 'online', activities: [] }); // Setze den Bot-Status zurück

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Wartungsmodus deaktiviert')
                .setDescription('Alle Befehle sind nun wieder aktiviert.');

            await interaction.reply({ embeds: [embed], components: [] });
        }
    }
};

function formatTime(timeInSeconds) {
    const weeks = Math.floor(timeInSeconds / 604800);
    const days = Math.floor((timeInSeconds % 604800) / 86400);
    const hours = Math.floor((timeInSeconds % 86400) / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;

    let formattedTime = '';
    if (weeks > 0) formattedTime += `${weeks} Woche(n) `;
    if (days > 0) formattedTime += `${days} Tag(e) `;
    if (hours > 0) formattedTime += `${hours} Stunde(n) `;
    if (minutes > 0) formattedTime += `${minutes} Minute(n) `;
    if (seconds > 0) formattedTime += `${seconds} Sekunde(n)`;
    return formattedTime;
}
function formatTime(timeInSeconds) {
    const days = Math.floor(timeInSeconds / 86400);
    const hours = Math.floor((timeInSeconds % 86400) / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    return `${days} Tage, ${hours} Stunden, ${minutes} Minuten und ${seconds} Sekunden`;
}