process.removeAllListeners('warning');
require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.MessageContent]
});

const distube = new DisTube(client, { plugins: [new YtDlpPlugin()] });

// Kode untuk daftarin command /play
const commands = [
    new SlashCommandBuilder().setName('play').setDescription('Putar lagu').addStringOption(option =>
    option.setName('lagu').setDescription('Link atau judul lagu').setRequired(true)
    ),
new SlashCommandBuilder().setName('skip').setDescription('Lewati lagu'),
new SlashCommandBuilder().setName('stop').setDescription('Stop musik')
].map(command => command.toJSON());

// Push Command ke Discord (Hanya sekali saat online)
client.once('ready', async () => {
    console.log(`Bot Online: ${client.user.tag}`);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'play') {
        const query = interaction.options.getString('lagu');
        const { channel } = interaction.member.voice;
        if (!channel) return interaction.reply('Kamu harus masuk VC dulu!');

        await interaction.reply('🔎 Mencari lagu...');
        distube.play(channel, query, {
            member: interaction.member,
            textChannel: interaction.channel,
            message: await interaction.fetchReply() // Kirim notifikasi via edit reply
        });
    }

    if (commandName === 'skip') {
        const queue = distube.getQueue(interaction);
        if (!queue) return interaction.reply('Tidak ada lagu.');
        queue.skip();
        interaction.reply('⏭️ Skip!');
    }

    if (commandName === 'stop') {
        distube.stop(interaction);
        interaction.reply('⏹️ Stop!');
    }
});

distube.on('playSong', (queue, song) => {
    queue.textChannel.send(`🎶 Memutar: \`${song.name}\``);
});

distube.on('error', (channel, e) => {
    console.error(e);
    if(channel) channel.send(`❌ Error: ${e.message}`);
});

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
client.login(process.env.TOKEN);
