const setupStateSchema = require('../models/setup-state');

async function updateServerStats(client) {
    const guilds = await setupStateSchema.find();
    for (const guildData of guilds) {
        const guild = client.guilds.cache.get(guildData.guildId);
        if (!guild) continue;

        const memberCount = guild.memberCount;
        const botCount = guild.members.cache.filter(member => member.user.bot).size;
        const owner = await guild.fetchOwner();
        const channelCount = guild.channels.cache.size;
        const roleCount = guild.roles.cache.size;

        const memberCountChannel = guild.channels.cache.get(guildData.channels.memberCount);
        const botCountChannel = guild.channels.cache.get(guildData.channels.botCount);
        const ownerChannel = guild.channels.cache.get(guildData.channels.owner);
        const channelCountChannel = guild.channels.cache.get(guildData.channels.channelCount);
        const roleCountChannel = guild.channels.cache.get(guildData.channels.roleCount);

        if (memberCountChannel) memberCountChannel.setName(`Members: ${memberCount}`);
        if (botCountChannel) botCountChannel.setName(`Bots: ${botCount}`);
        if (ownerChannel) ownerChannel.setName(`Owner: ${owner.user.tag}`);
        if (channelCountChannel) channelCountChannel.setName(`Channels: ${channelCount}`);
        if (roleCountChannel) roleCountChannel.setName(`Roles: ${roleCount}`);
    }
}

// Update server stats every 10 minutes
setInterval(() => updateServerStats(client), 600000);
