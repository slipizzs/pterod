require('dotenv').config();
const { Client, IntentsBitField, Collection } = require('discord.js');
const mongoose = require("mongoose")
const logs = require("discord-logs")
const VerifyModel = require('./models/verify');
const commandFiles = [/* Array von Befehlsdateipfaden */];
const eventHandler = require('./handlers/eventHandler');
const welcomeMessage = require('./server/welcome');
const { startAntiRaidSystem } = require('./commands/raid/raid');
const { handleLogs } = require('./handlers/handlerlogs');
const { loadButtonHandler } = require('./handlers/buttonHandler');
const { loadEvents } = require('./handlers/eventloader');
const { exec } = require('child_process')

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.GuildPresences,
    IntentsBitField.Flags.GuildMessageReactions,
  ]
});
client.commands = new Collection();
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  // Fügen Sie den Befehl mit dem Namen des Befehls als Schlüssel hinzu
  client.commands.set(command.name, command);
} 



client.on('interactionCreate', async interaction => {
  if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
          await command.callback(client, interaction);
      } catch (error) {
          console.error(error);
          await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
  }
  if (interaction.isButton()) {
      const ticketresponse = require('./events/ticket/ticketresponse');
      ticketresponse.execute(interaction);
  }
});
client.on('interactionCreate', async interaction => {
if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.callback(client, interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
}
if (interaction.isButton()) {
    const ticketaction = require('./events/ticket/ticketaction');
    ticketaction.execute(client, interaction);
    
}
});
// Button Interaktion
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  switch (interaction.customId) {
      case 'stop_bot':
          exec('pm2 stop bot', (error, stdout, stderr) => {
              if (error) {
                  console.error(`Fehler beim Stoppen des Bots: ${error.message}`);
                  return;
              }
              if (stderr) {
                  console.error(`Fehler beim Stoppen des Bots: ${stderr}`);
                  return;
              }
              console.log(`Bot erfolgreich gestoppt: ${stdout}`);
          });
          break;
      case 'restart_bot':
          exec('pm2 restart bot', (error, stdout, stderr) => {
              if (error) {
                  console.error(`Fehler beim Neustarten des Bots: ${error.message}`);
                  return;
              }
              if (stderr) {
                  console.error(`Fehler beim Neustarten des Bots: ${stderr}`);
                  return;
              }
              console.log(`Bot erfolgreich neu gestartet: ${stdout}`);
          });
          break;
      default:
          break;
  }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  try {
    // Überprüfe, ob die Rolle entfernt wurde
    const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

    // Überprüfe, ob die entfernte Rolle die Verifizierungsrolle ist
    const roleID = '1228796096994873414'; // Die ID der Verifizierungsrolle
    if (removedRoles.has(roleID)) {
      // Entferne die ID aus der Datenbank
      await VerifyModel.findOneAndDelete({ MemberID: newMember.user.id });
    }
  } catch (error) {
    console.error('Fehler beim Entfernen der Rolle:', error);
  }
});



client.events = new Collection();

logs(client, {debug: true});




(async () => {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB database');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
})();
client.on('guildMemberAdd', (member) => {
  welcomeMessage(client, member);
})
// Lade alle Handler aus dem Ordner 'handlers'



handleLogs(client)
eventHandler(client);
loadButtonHandler(client);
startAntiRaidSystem(client);
loadEvents(client);

client.login(process.env.TOKEN);
module.exports =  client;