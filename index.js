process.removeAllListeners('warning');
require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, Collection, GatewayVoiceServerUpdateDispatchData, GatewayVoiceStateUpdateDispatchData } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const playdl = require('play-dl');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.MessageContent]
});

const player = createAudioPlayer();
const queues = new Collection(); // Menyimpan queue per server

// Slash Commands
const commands = [
    new SlashCommandBuilder().setName('play').setDescription('Putar lagu YouTube').addStringOption(option => option.setName('url').setDescription('Link YouTube').setRequired(true)),
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
    const { guild } = interaction;

    if (!channel) return interaction.reply('Masuk VC dulu!');

    if (commandName === 'play') {
        const url = interaction.options.getString('url');
        await interaction.reply('🔎 Mencari...');

        try {
            // Validasi YouTube
            const yt_info = await playdl.video_basic_info(url);

            // Setup Voice Connection
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
            });

            // Setup Resource
            const stream = await playdl.stream(url);
            const resource = createAudioResource(stream.stream, { inputType: stream.type });

            player.play(resource);
            connection.subscribe(player);

            // Simpan queue sederhana (opsional)
            queues.set(guild.id, { connection, textChannel: interaction.channel });

            await interaction.editReply(`🎶 Memutar: \`${yt_info.video_details.title}\``);
        } catch (e) {
            console.error(e);
            interaction.editReply('❌ Error memutar lagu.');
        }
    }

    if (commandName === 'stop') {
        const queue = queues.get(guild.id);
        if (queue && queue.connection) {
            queue.connection.destroy();
            queues.delete(guild.id);
            interaction.reply('⏹️ Stop!');
        } else {
            interaction.reply('Tidak ada lagu.');
        }
    }

    if (commandName === 'skip') {
        // Karena ini single player logic, skip = stop buat saat ini
        const queue = queues.get(guild.id);
        if (queue) {
            queue.connection.destroy();
            queues.delete(guild.id);
            interaction.reply('⏭️ Skip!');
        } else {
            interaction.reply('Tidak ada lagu.');
        }
    }
});

client.login(process.env.TOKEN);
