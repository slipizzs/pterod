const yts = require('yt-search');
const ytdl = require('ytdl-core');
const { EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioResource, createAudioPlayer, AudioPlayerStatus } = require('@discordjs/voice');
const Queue = require('../../models/queue');
const queue = new Map();

module.exports = {
    name: 'play',
    description: 'Spielt ein Lied von YouTube oder Spotify ab.',
    options: [
        {
            name: 'song',
            description: 'Der YouTube- oder Spotify-Link oder Titel des Songs, den du abspielen möchtest',
            type: 3,
            required: true,
        },
    ],
    callback: async (client, interaction) => {
        const song = interaction.options.getString('song');

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply({ content: 'Du musst in einem Voice-Channel sein, um einen Song abzuspielen!', ephemeral: true });
        }

        const permissions = voiceChannel.permissionsFor(client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            return interaction.reply({ content: 'Ich benötige die Berechtigungen, um deinem Voice-Channel beizutreten und darin zu sprechen!', ephemeral: true });
        }

        const serverQueue = queue.get(interaction.guild.id);

        let songDetails;
        if (ytdl.validateURL(song)) {
            const songInfo = await ytdl.getInfo(song);
            songDetails = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url,
            };
        } else {
            const videoFinder = async (query) => {
                const videoResult = await yts(query);
                return (videoResult.videos.length > 0) ? videoResult.videos[0] : null;
            };

            const video = await videoFinder(song);
            if (video) {
                songDetails = {
                    title: video.title,
                    url: video.url,
                };
            } else {
                return interaction.reply({ content: 'Es wurden keine Ergebnisse für die Suche gefunden.', ephemeral: true });
            }
        }

        if (!serverQueue) {
            const queueContruct = {
                textChannel: interaction.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                player: createAudioPlayer(),
            };

            queue.set(interaction.guild.id, queueContruct); // Füge die Warteschlange hinzu
            queueContruct.songs.push(songDetails);

            try {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                });

                queueContruct.connection = connection;
                playSong(interaction.guild, queueContruct.songs[0]);

                connection.subscribe(queueContruct.player);

                queueContruct.player.on(AudioPlayerStatus.Idle, async () => {
                    queueContruct.songs.shift();
                    if (queueContruct.songs.length > 0) {
                        playSong(interaction.guild, queueContruct.songs[0]);
                    } else {
                        queueContruct.connection.destroy();
                        queue.delete(interaction.guild.id); // Entferne die Warteschlange
                        await Queue.findOneAndDelete({ guildId: interaction.guild.id });
                    }
                });

                queueContruct.player.on('error', async (error) => {
                    console.error(error);
                    queueContruct.connection.destroy();
                    queue.delete(interaction.guild.id); // Entferne die Warteschlange
                    await Queue.findOneAndDelete({ guildId: interaction.guild.id });
                    interaction.reply({ content: 'Es gab einen Fehler beim Abspielen des Songs.', ephemeral: true });
                });

                await new Queue({ guildId: interaction.guild.id, songs: queueContruct.songs }).save();

                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Now Playing')
                    .setDescription(`[${songDetails.title}](${songDetails.url})`);

                await interaction.reply({ embeds: [embed] });
            } catch (err) {
                console.error(err);
                queue.delete(interaction.guild.id);
                return interaction.reply({ content: 'Es gab einen Fehler beim Verbinden mit dem Voice-Channel.', ephemeral: true });
            }
        } else {
            serverQueue.songs.push(songDetails);
            await Queue.findOneAndUpdate({ guildId: interaction.guild.id }, { $push: { songs: songDetails } });

            return interaction.reply({ content: `**${songDetails.title}** wurde zur Warteliste hinzugefügt!`, ephemeral: true });
        }
    },
};

async function playSong(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id); // Entferne die Warteschlange
        await Queue.findOneAndDelete({ guildId: guild.id });
        return;
    }

    const stream = ytdl(song.url, { filter: 'audioonly' });
    const resource = createAudioResource(stream);
    serverQueue.player.play(resource);
}

module.exports.queue = queue;
module.exports.playSong = playSong;