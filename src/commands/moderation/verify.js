const { PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const VerifyModel = require('../../models/verify');

module.exports = {
  name: 'verify',
  description: 'Verifiziere deinen Account',
  permissions: [PermissionsBitField.Flags.Administrator],
  options: [
    {
      name: 'role',
      description: 'Die Rolle, die du nach der Verifizierung erhalten möchtest',
      type: 8, // Typ der Option ist ROLE, um die Rolle zu erhalten
      required: true,
    },
    {
      name: 'channel',
      description: 'Der Kanal, in dem die Verifizierungsnachricht gesendet werden soll',
      type: 7, // Typ der Option ist CHANNEL, um den Kanal zu erhalten
      required: true,
    },
  ],
  callback: async (client, interaction) => {
    try {
      // Überprüfe, ob der Benutzer bereits verifiziert ist
      let existingVerification = await VerifyModel.findOne({ MemberID: interaction.user.id });

      // Wenn bereits eine Verifizierung vorhanden ist, aktualisiere die Daten
      if (existingVerification) {
        existingVerification.ChannelID = interaction.options.getChannel('channel').id;
        existingVerification.RoleID = interaction.options.getRole('role').id;
        existingVerification.VerifiedAt = Date.now();
        await existingVerification.save();
      } else {
        // Erstelle einen neuen Datensatz in der Datenbank
        const newVerification = new VerifyModel({
          GuildID: interaction.guild.id,
          MemberID: interaction.user.id,
          ChannelID: interaction.options.getChannel('channel').id,
          RoleID: interaction.options.getRole('role').id,
          Type: 'verify',
          IsActive: true,
          VerifiedAt: Date.now()
        });
        await newVerification.save();
      }

      // Hole die ausgewählte Rolle und den Zielkanal aus den Optionen
      const selectedRole = interaction.options.getRole('role');
      const selectedChannel = interaction.options.getChannel('channel');

      // Lösche das alte Embed, falls vorhanden
      const messages = await selectedChannel.messages.fetch({ limit: 1 });
      const oldMessage = messages.first();
      if (oldMessage && oldMessage.embeds.length > 0) {
        await oldMessage.delete();
      }

      // Erstelle den Button für die Verifizierung
      const verifyButton = new ButtonBuilder()
        .setCustomId('verify_button')
        .setLabel('Verifizieren')
        .setStyle(ButtonStyle.Success);

      // Füge den Button zu einer Action Row hinzu
      const actionRow = new ActionRowBuilder().addComponents(verifyButton);

      // Sende eine Embed-Nachricht mit dem Verifizierungsbutton in den Zielkanal
      const embed = new EmbedBuilder()
        .setTitle('Account Verifizierung')
        .setDescription(`Du hast die Rolle "${selectedRole.name}" ausgewählt. Klicke auf den Button, um deinen Account zu verifizieren.`);

      await selectedChannel.send({ embeds: [embed], components: [actionRow] });

      // Bestätigungsnachricht an den Benutzer senden
      await interaction.reply({ content: `Die Verifizierungsnachricht wurde erfolgreich im Kanal ${selectedChannel} gesendet.`, ephemeral: true });

    } catch (error) {
      console.error('Fehler beim Verifizieren des Benutzers:', error);
      await interaction.reply({ content: 'Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.', ephemeral: true });
    }
  }
};