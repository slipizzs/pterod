const fs = require('fs');
const path = require('path');



function loadButtonHandler(client) {
    const buttonFolderPath = path.join(__dirname, 'buttons'); // Pfadeinstellungen entsprechend anpassen

    // Überprüfen, ob der Button-Ordner existiert
    if (!fs.existsSync(buttonFolderPath)) {
        console.error('Button folder does not exist');
        return;
    }

    // Alle Dateien im Button-Ordner laden
    fs.readdirSync(buttonFolderPath).forEach(file => {
        // Nur JavaScript-Dateien berücksichtigen
        if (file.endsWith('.js')) {
            const buttonInteraction = require(path.join(buttonFolderPath, file));

            // Überprüfen, ob die geladene Datei eine gültige Button-Interaktion ist
            if (buttonInteraction && typeof buttonInteraction.execute === 'function') {
                client.on('interactionCreate', async interaction => {
                    try {
                        // Prüfen, ob es sich um eine Button-Interaktion handelt und die Custom-ID übereinstimmt
                        if (interaction.isButton() && interaction.customId === buttonInteraction.name) {
                            await buttonInteraction.execute(client, interaction);
                        }
                    } catch (error) {
                        console.error('Error executing button interaction:', error);
                        await interaction.reply({ content: 'An error occurred while executing this interaction!', ephemeral: true });
                    }
                });
                console.log(`Loaded button interaction: ${buttonInteraction.name}`);
            } else {
                console.error(`Invalid button interaction file: ${file}`);
            }
        }
    });
}


module.exports = { loadButtonHandler };
