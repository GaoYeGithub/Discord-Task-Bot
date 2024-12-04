const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const AnnouncementBot = require('../utils/AnnouncementBot');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send an announcement to server members')
    .addStringOption(option =>
      option.setName('title').setDescription('Announcement title').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('message').setDescription('Announcement message content').setRequired(true)
    )
    .addRoleOption(option =>
      option.setName('role').setDescription('Optional: Send announcement to specific role').setRequired(false)
    )
    .addBooleanOption(option =>
      option.setName('dm').setDescription('Send as direct messages? (Default: false)').setRequired(false)
    )
    .addStringOption(option =>
      option.setName('image').setDescription('Optional image URL for the announcement').setRequired(false)
    ),
  async execute(interaction) {
    const title = interaction.options.getString('title');
    const message = interaction.options.getString('message');
    const role = interaction.options.getRole('role');
    const sendAsDM = interaction.options.getBoolean('dm') || false;
    const imageUrl = interaction.options.getString('image');

    const announcementBot = new AnnouncementBot(interaction.client);

    const announcementOptions = { title, message, imageUrl, excludeBots: true };

    try {
      if (sendAsDM) {
        const results = await announcementBot.sendAnnouncementToAll(interaction.guildId, announcementOptions);
        return interaction.reply(`✅ DMs Sent: ${results.successful.length}, ❌ Failed: ${results.failed.length}`);
      }

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(message)
        .setColor('#3498db')
        .setTimestamp();

      if (imageUrl) embed.setImage(imageUrl);

      const announcementChannel = interaction.channel;
      await announcementChannel.send({ content: role ? `<@&${role.id}>` : '@everyone', embeds: [embed] });

      await interaction.reply({ content: 'Announcement sent successfully!', ephemeral: true });
    } catch (error) {
      console.error('Error sending announcement:', error);
      await interaction.reply({ content: 'Failed to send announcement.', ephemeral: true });
    }
  },
};

