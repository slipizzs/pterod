const { PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const VerifyModel = require('../../models/verify');

module.exports = {
  name: 'verify_button',
  async execute(client, interaction) {
    try {
      // Feste Rolen-ID einfügen
      const roleID = '1228796096994873414';

      // Überprüfe, ob der Benutzer bereits verifiziert ist
      const existingVerification = await VerifyModel.findOne({ MemberID: interaction.user.id });

      // Wenn der Benutzer bereits verifiziert ist, sende eine Nachricht und beende die Ausführung
      if (existingVerification && existingVerification.IsActive) {
        return interaction.reply({ content: 'Du wurdest bereits verifiziert.', ephemeral: true });
      }

      // Hole die Rolle aus der Guild-Rollenliste
      const role = interaction.guild.roles.cache.get(roleID);

      // Überprüfe, ob die Rolle gefunden wurde
      if (!role) {
        console.error('Rolle nicht gefunden.');
        return interaction.reply({ content: 'Die Rolle wurde nicht gefunden.', ephemeral: true });
      }

      // Füge die Rolle dem Benutzer hinzu
      await interaction.member.roles.add(role);

      // Speichere die Member-ID in der Datenbank, um anzuzeigen, dass der Benutzer verifiziert wurde
      const newVerification = new VerifyModel({
        GuildID: interaction.guild.id,
        MemberID: interaction.user.id,
        IsActive: true,
        VerifiedAt: Date.now()
      });
      await newVerification.save();

      // Sende eine Bestätigungsnachricht an den Benutzer
      await interaction.reply({ content: `Du wurdest erfolgreich verifiziert und hast die Rolle ${role} erhalten!`, ephemeral: true });
    } catch (error) {
      console.error('Fehler beim Verifizieren des Benutzers:', error);
      await interaction.reply({ content: 'Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.', ephemeral: true });
    }
  }
};

