const fs = require('fs');
const path = require('path');

module.exports = {
  loadEvents: (client) => {
    const eventFiles = fs.readdirSync(path.resolve(__dirname, '../events/')).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
      const event = require(path.resolve(__dirname, `../events/${file}`));
      if (event.execute && typeof event.execute === 'function') {
        client.on(event.name, (...args) => event.execute(...args, client));
        console.log(`Loaded event: ${event.name}`);
      } else {
        console.warn(`Invalid event handler in file ${file}`);
      }
    }
  }
};