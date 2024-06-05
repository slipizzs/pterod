const { ChannelType, Collection, PermissionsBitField } = require('discord.js');
const schema = require('../models/joint-to-create');
let voiceManager = new Collection();

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState, client) {
        const { member, guild } = oldState;
        const newChannel = newState.channel;
        const oldChannel = oldState.channel;

        try {
            // Fetch the configuration from the database
            const data = await schema.findOne({ Guild: guild.id });
            if (!data) {
                console.log(`No data found for guild ${guild.id}`);
                return;
            }

            const channelID = data.Channel;
            const mainChannel = client.channels.cache.get(channelID);
            const userLimit = data.UserLimit;

            if (!mainChannel) {
                console.log(`Main channel not found: ${channelID}`);
                return;
            }

            // If the user joins the main channel
            if (oldChannel !== newChannel && newChannel && newChannel.id === mainChannel.id) {
                console.log(`User ${member.user.tag} joined the main channel`);
                try {
                    const voiceChannel = await guild.channels.create({
                        name: `🔊${member.user.tag}`,
                        type: ChannelType.GuildVoice,
                        parent: newChannel.parent,
                        permissionOverwrites: [
                            {
                                id: member.id,
                                allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ManageChannels],
                            },
                            {
                                id: guild.id,
                                allow: [PermissionsBitField.Flags.Connect],
                            },
                        ],
                        userLimit: userLimit,
                    });
                    voiceManager.set(member.id, voiceChannel.id);

                    await newChannel.permissionOverwrites.edit(member, {
                        Connect: false,
                    });

                    setTimeout(() => {
                        newChannel.permissionOverwrites.delete(member).catch(console.error);
                    }, 30000);

                    setTimeout(() => {
                        member.voice.setChannel(voiceChannel).catch(console.error);
                    }, 500);
                } catch (error) {
                    console.error('Error creating voice channel:', error);
                }
            }

            // If the user leaves a joint-to-create channel
            const jointToCreate = voiceManager.get(member.id);
            const remainingMembers = oldChannel?.members.filter((m) => !m.user.bot);

            if (
                jointToCreate &&
                oldChannel &&
                oldChannel.id === jointToCreate &&
                (!newChannel || newChannel.id !== jointToCreate)
            ) {
                if (remainingMembers.size > 0) {
                    const randomMemberID = remainingMembers.random().id;
                    const randomMember = guild.members.cache.get(randomMemberID);
                    if (randomMember) {
                        randomMember.voice.setChannel(oldChannel).then(() => {
                            oldChannel.setName(randomMember.user.username).catch(() => null);
                            oldChannel.permissionOverwrites.edit(randomMember, {
                                Connect: true,
                                ManageChannels: true,
                            });
                        }).catch(console.error);
                        voiceManager.set(member.id, null);
                        voiceManager.set(randomMember.id, oldChannel.id);
                    }
                } else {
                    voiceManager.set(member.id, null);
                    oldChannel.delete().catch(() => null);
                }
            }
        } catch (error) {
            console.error('Error handling voiceStateUpdate event:', error);
        }
    },
};