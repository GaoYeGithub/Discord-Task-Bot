const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

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

const sendAnnouncementCommand = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send an announcement to server members')
    .addStringOption(option => 
      option.setName('title')
        .setDescription('Announcement title')
        .setRequired(true)
    )
    .addStringOption(option => 
      option.setName('message')
        .setDescription('Announcement message content')
        .setRequired(true)
    )
    .addRoleOption(option => 
      option.setName('role')
        .setDescription('Optional: Send announcement to specific role')
        .setRequired(false)
    )
    .addBooleanOption(option => 
      option.setName('dm')
        .setDescription('Send as direct messages? (Default: false)')
        .setRequired(false)
    )
    .addStringOption(option => 
      option.setName('image')
        .setDescription('Optional image URL for the announcement')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({
        content: 'You do not have permission to send server-wide announcements.',
        ephemeral: true
      });
    }

    const title = interaction.options.getString('title');
    const message = interaction.options.getString('message');
    const role = interaction.options.getRole('role');
    const sendAsDM = interaction.options.getBoolean('dm') || false;
    const imageUrl = interaction.options.getString('image');

    try {
      await interaction.deferReply({ ephemeral: true });

      const announcementBot = new AnnouncementBot(interaction.client);
      
      const announcementOptions = {
        title,
        message,
        imageUrl: imageUrl || undefined,
        excludeBots: true
      };

      let targetMembers;
      if (role) {
        targetMembers = interaction.guild.members.cache
          .filter(member => member.roles.cache.has(role.id));
      } else {
        targetMembers = interaction.guild.members.cache;
      }

      if (sendAsDM) {
        const results = await announcementBot.sendAnnouncementToAll(
          interaction.guildId, 
          announcementOptions
        );

        await interaction.editReply({
          content: `Announcement sent!\n` +
                   `✅ Successful DMs: ${results.successful.length}\n` +
                   `❌ Failed DMs: ${results.failed.length}`,
          ephemeral: true
        });
      } else {
        const announcementChannel = interaction.channel;
        
        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(message)
          .setColor('#3498db')
          .setTimestamp()
          .setFooter({ 
            text: `Announcement by ${interaction.user.username}`, 
            iconURL: interaction.user.avatarURL() || undefined 
          });

        if (imageUrl) {
          embed.setImage(imageUrl);
        }

        await announcementChannel.send({ 
          content: role ? `<@&${role.id}>` : '@everyone', 
          embeds: [embed] 
        });

        await interaction.editReply({
          content: 'Announcement sent successfully to the channel!',
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Announcement error:', error);
      await interaction.editReply({
        content: 'Failed to send announcement. Please try again.',
        ephemeral: true
      });
    }
  }
};

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

const deployCommands = async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID, 
        process.env.GUILD_ID
      ),
      { body: [sendAnnouncementCommand.data.toJSON()] }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  deployCommands();
  const announcementBot = new AnnouncementBot(client);
  
  announcementBot.sendAnnouncementToAll(process.env.GUILD_ID, {
    title: '🌟 Welcome to JA! 🌟',
    message: 'Are you interested in recieveing updates, tasks, and announcements like this? Or is it to annoying?\n\n',
    color: '#e91e63',
    imageUrl: 'https://cloud-qiyu81fa8-hack-club-bot.vercel.app/0image-removebg-preview__3_.png', 
    excludeBots: true,
    footerText: 'Let\'s make great things happen together!'
  });

  announcementBot.scheduleAnnouncement(process.env.GUILD_ID, {
    title: '📅 This Weeks Task',
    message: '**This Week\'s Highlights:**\n' +
             '• Upcoming events\n' +
             '• Team achievements\n' +
             '• Important reminders\n\n' +
             'Stay informed and stay connected!',
    intervalMinutes: 10080
  });
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'announce') {
    try {
      await sendAnnouncementCommand.execute(interaction);
    } catch (error) {
      console.error('Slash command error:', error);
      await interaction.reply({
        content: 'There was an error executing this command.',
        ephemeral: true
      });
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
