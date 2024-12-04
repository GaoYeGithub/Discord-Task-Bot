const { EmbedBuilder } = require('discord.js');

class AnnouncementBot {
  constructor(client) {
    this.client = client;
  }

  async sendAnnouncementToAll(guildId, options) {
    try {
      const guild = await this.client.guilds.fetch(guildId);
      
      await guild.members.fetch();

      const embed = new EmbedBuilder()
        .setTitle(options.title)
        .setDescription(options.message)
        .setColor(options.color || '#3498db')
        .setTimestamp()
        .setThumbnail(guild.iconURL() || null)
        .addFields(
          { 
            name: '📢 Announcement', 
            value: 'Please read the message carefully.', 
            inline: false 
          }
        )
        .setFooter({ 
          text: options.footerText || `Announcement from ${guild.name}`, 
          iconURL: guild.iconURL() || undefined 
        });

      if (options.imageUrl) {
        embed.setImage(options.imageUrl);
      }

      const results = {
        successful: [],
        failed: []
      };

      for (const [memberId, member] of guild.members.cache) {
        if (options.excludeBots && member.user.bot) continue;

        try {
          await member.send({ embeds: [embed] });
          results.successful.push(memberId);
        } catch (dmError) {
          results.failed.push(memberId);
          console.log(`Could not DM user ${memberId}: ${dmError.message}`);
        }
      }

      return results;
    } catch (error) {
      console.error('Error sending announcements:', error);
      throw error;
    }
  }

  scheduleAnnouncement(guildId, scheduleOptions) {
    return setInterval(async () => {
      try {
        await this.sendAnnouncementToAll(guildId, {
          ...scheduleOptions,
          color: '#2ecc71',
          footerText: 'Scheduled Weekly Update'
        });
      } catch (error) {
        console.error('Scheduled announcement error:', error);
      }
    }, scheduleOptions.intervalMinutes * 60 * 1000);
  }
}

module.exports = AnnouncementBot;
