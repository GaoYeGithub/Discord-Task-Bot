const AnnouncementBot = require('../utils/AnnouncementBot');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`Logged in as ${client.user.tag}!`);
    const announcementBot = new AnnouncementBot(client);

    announcementBot.scheduleAnnouncement(process.env.GUILD_ID, {
      title: 'Weekly Updates',
      message: 'Here are the weekly highlights!',
      intervalMinutes: 10080,
    });
  },
};
