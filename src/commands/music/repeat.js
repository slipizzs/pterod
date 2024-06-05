const { EmbedBuilder } = require('discord.js');

// Verwende eine Map, um den Loop-Status für jeden Server zu speichern
const loopStates = new Map();

module.exports = {
    name: 'loop',
    description: 'Schaltet die Wiederholung von Songs ein oder aus.',
    options: [],
    callback: async (client,interaction) => {
        const guildId = interaction.guildId;

        // Überprüfe den aktuellen Loop-Status des Servers
        let loopState = loopStates.get(guildId) || false;

        // Ändere den Loop-Status
        loopState = !loopState;
        loopStates.set(guildId, loopState);

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Loop')
            .setDescription(`Loop ist jetzt ${loopState ? 'aktiviert' : 'deaktiviert'}.`);

        return interaction.reply({ embeds: [embed], ephemeral: true });
    },
    handleSongEnd: async (serverQueue) => {
        // Überprüfe den Loop-Status für den Server
        const loopState = loopStates.get(serverQueue.guild.id) || false;

        // Entferne den abgespielten Song aus der Warteschlange
        const removedSong = serverQueue.songs.shift();

        // Füge den abgespielten Song am Ende der Warteschlange wieder hinzu, wenn Loop aktiviert ist
        if (loopState) {
            serverQueue.songs.push(removedSong);
        }

        // Überprüfe, ob weitere Songs in der Warteschlange sind
        if (serverQueue.songs.length > 0) {
            // Spiele den nächsten Song in der Warteschlange ab
            const nextSong = serverQueue.songs[0];
            // Hier kannst du den nächsten Song abspielen, z. B. durch Senden eines Events an ein anderes Modul
        } else {
            // Wenn keine Songs mehr in der Warteschlange sind, verlasse den Voice-Channel
            serverQueue.voiceChannel.leave();
        }
    },
};