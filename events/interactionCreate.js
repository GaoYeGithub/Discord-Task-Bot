module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
      if (!interaction.isCommand()) return;
  
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
  
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error('Command execution error:', error);
        await interaction.reply({ content: 'Error executing command.', ephemeral: true });
      }
    },
  };
