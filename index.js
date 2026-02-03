process.removeAllListeners('warning');
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const distube = new DisTube(client, { plugins: [new YtDlpPlugin()] });

client.on('ready', () => console.log(`Bot Online: ${client.user.tag}`));
distube.on('error', e => console.log(e));

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith('!')) return;
    const args = message.content.slice(1).split(' ');
    const cmd = args.shift();

    if (cmd === 'play') {
        if (!message.member.voice.channel) return message.reply('Masuk VC dulu!');
        distube.play(message.member.voice.channel, args.join(' '), { textChannel: message.channel, message: message });
    }
    if (cmd === 'skip') { distube.skip(message); message.react('⏭️'); }
    if (cmd === 'stop') { distube.stop(message); message.react('⏹️'); }
});

client.login(process.env.TOKEN);
