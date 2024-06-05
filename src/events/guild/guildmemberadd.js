const {EmbedBuilder, GuildMember, Embed} = require("discord.js");
const {Schema} = require ("../../schemas/welcome");

module.exports = {
    name: "guildmemberadd",
    async execute(member) {
        Schema.findOne({GuildId: member.guild.id}, async (err,data) => {
            if (!data) return;
            let channel = data.Channel;
            let Msg = data.Msg || "";
            let Role = data.Role;

            const {user, GuildId} = member;
            const welcomeChannel = member.guild.channels.cache.get(data.Channel);

            const welcomeEmbed = new EmbedBuilder()
            .setTitle("**New member!**")
            .setDescription(data.Msg)
            .setColor(0x037821)
            .addFields({name: "Total Members", value: `${guild.memberCount}`})
            .setTimestamp();

            welcomeChannel.send({embeds: [welcomeEmbed]});
            member.role.add(data.Role);
        })
    }
}
