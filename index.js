process.removeAllListeners('warning');
require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const { DisTube } = require('distube');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.MessageContent]
});

// KITA HAPUS IMPORT YTDLP DAN KOSONGKAN PLUGINS
const distube = new DisTube(client, {
    searchSongs: 10,
    leaveOnEmpty: true,
    emptyCooldown: 30,
    plugins: [] // Kosong = Gunakan default extractors
});

// Slash Commands
const commands = [
    new SlashCommandBuilder().setName('play').setDescription('Putar lagu').addStringOption(option => option.setName('lagu').setDescription('Link atau judul').setRequired(true)),
    new SlashCommandBuilder().setName('skip').setDescription('Lewati lagu'),
    new SlashCommandBuilder().setName('stop').setDescription('Stop musik')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {
    console.log(`Bot Online: ${client.user.tag}`);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Slash commands registered!');
    } catch (error) { console.error(error); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName } = interaction;
    const { channel } = interaction.member.voice;

    if (commandName === 'play') {
        const query = interaction.options.getString('lagu');
        if (!channel) return interaction.reply('Masuk VC dulu!');

        await interaction.reply('🔎 Mencari lagu...');
        distube.play(channel, query, {
            member: interaction.member,
            textChannel: interaction.channel,
            message: await interaction.fetchReply()
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

client.login(process.env.TOKEN);
