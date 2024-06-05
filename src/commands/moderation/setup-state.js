const { PermissionsBitField, ChannelType } = require('discord.js');
const setupStateSchema = require('../../models/setup-state');

module.exports = {
    name: 'setup-state',
    description: 'Setup state category with server statistics',
    callback: async(client,message, args) => {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return message.channel.send('You do not have permission to use this command.');
        }

        const guild = message.guild;

        // Create category
        const category = await guild.channels.create({
            name: 'Server Stats',
            type: ChannelType.GuildCategory
        });

        // Create voice channels
        const memberCountChannel = await guild.channels.create({
            name: `Members: ${guild.memberCount}`,
            type: ChannelType.GuildVoice,
            parent: category.id,
            permissionOverwrites: [{
                id: guild.id,
                deny: [PermissionsBitField.Flags.Connect]
            }]
        });

        const botCountChannel = await guild.channels.create({
            name: `Bots: ${guild.members.cache.filter(member => member.user.bot).size}`,
            type: ChannelType.GuildVoice,
            parent: category.id,
            permissionOverwrites: [{
                id: guild.id,
                deny: [PermissionsBitField.Flags.Connect]
            }]
        });

        const ownerChannel = await guild.channels.create({
            name: `Owner: ${guild.ownerId}`,
            type: ChannelType.GuildVoice,
            parent: category.id,
            permissionOverwrites: [{
                id: guild.id,
                deny: [PermissionsBitField.Flags.Connect]
            }]
        });

        const channelCountChannel = await guild.channels.create({
            name: `Channels: ${guild.channels.cache.size}`,
            type: ChannelType.GuildVoice,
            parent: category.id,
            permissionOverwrites: [{
                id: guild.id,
                deny: [PermissionsBitField.Flags.Connect]
            }]
        });

        const roleCountChannel = await guild.channels.create({
            name: `Roles: ${guild.roles.cache.size}`,
            type: ChannelType.GuildVoice,
            parent: category.id,
            permissionOverwrites: [{
                id: guild.id,
                deny: [PermissionsBitField.Flags.Connect]
            }]
        });

        // Save to database
        const setupState = new setupStateSchema({
            guildId: guild.id,
            categoryId: category.id,
            channels: {
                memberCount: memberCountChannel.id,
                botCount: botCountChannel.id,
                owner: ownerChannel.id,
                channelCount: channelCountChannel.id,
                roleCount: roleCountChannel.id
            }
        });
        await setupState.save();

        message.channel.send('Server statistics category and channels have been set up.');
    }
};