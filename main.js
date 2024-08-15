import { clearMessages } from '@umamdev/wabe'
import { wabe } from './helper/bot.js';
import { meta, tiktok, yutub } from './downloader.js';
import config from "./config.js";
import { groupParticipants, groupUpdate } from './group.js';
import { call } from './call.js';
import { bendera, caklontong, checkAnswer, gambar, jenaka, tebakSession } from './tebak/index.js';
import sticker from './features/sticker.js';
import { quotes, cerpen } from './features/random.js';
import { ytPlay } from './features/youtube.js';
import { removebg } from './features/image.js';
import { gemini, gemmaGroq, llamaGroq, mistral, mixtralGroq } from './ai.js';
import { helpMessage } from './helper/help.js';
import { gambarPdf } from './features/pdf.js';
import { tomp3 } from './features/converter.js';
import { calculatePing, systemSpec } from './features/owner/server.js';

const bot = new wabe({
    phoneNumber: config.notelp,
    sessionId: config.namaSesi,
    useStore: false
})

const plugins = {
    'jenaka': async (id, sock) => await jenaka(id, sock),
    'lontong': async (id, sock) => await caklontong(id, sock),
    'gambar': async (id, sock) => await gambar(id, sock),
    'bendera': async (id, sock) => await bendera(id, sock),
    'ping': async (id, sock, m) => await sock.sendMessage(id, { text: `Bot merespon dalam *_${calculatePing(m.messageTimestamp, Date.now())} detik_*` }),
    'stats': async (id, sock) => await sock.sendMessage(id, { text: `${await systemSpec()}` }),
    'yp': async (id, sock, psn) => {
        try {
            if (psn === '') {
                sock.sendMessage(id, { text: "Masukan judul lagu yang akan diputar" })
                return
            }
            await sock.sendMessage(id, { text: 'Processing, please wait...' });
            let result = await ytPlay(psn)
            let caption = '*Youtube Play Result*'
            caption += '\nTitle :' + `*${result.title}*`
            caption += '\nChannel :' + `*${result.channel}*`
            caption += '\n _⏳Bentar yaa, audio lagi dikirim⏳_'
            await sock.sendMessage(id, { text: caption })
            await sock.sendMessage(id, { audio: { url: result.video } });
        } catch (error) {
            await sock.sendMessage(id, { text: 'ups,' + error.message });
        }
    },
    'yd': async (id, sock, psn) => {
        try {
            await sock.sendMessage(id, { text: 'Processing, please wait...' });
            let result = await yutub(psn)
            let caption = '*Youtube Video Result*'
            caption += '\nTitle :' + `*${result.title}*`
            caption += '\nChannel :' + `*${result.channel}*`
            await sock.sendMessage(id, { video: { url: result.video }, caption });
        } catch (error) {
            await sock.sendMessage(id, { text: error.message });
        }
    },
    'ymd': async (id, sock, psn) => {
        try {
            await sock.sendMessage(id, { text: 'Processing, please wait...' });
            let result = await yutub(psn);
            await sock.sendMessage(id, { audio: { url: result.video } });
        } catch (error) {
            await sock.sendMessage(id, { text: error.message });
        }
    },
    'td': async (id, sock, psn) => {
        try {
            await sock.sendMessage(id, { text: 'Processing, please wait...' });
            let result = await tiktok(psn);
            await sock.sendMessage(id, { video: { url: result.video }, caption: result.title });
        } catch (error) {
            await sock.sendMessage(id, { text: error.message });
        }
    },
    'tmd': async (id, sock, psn) => {
        try {
            await sock.sendMessage(id, { text: 'Processing, please wait...' });
            let result = await tiktok(psn);
            await sock.sendMessage(id, { audio: { url: result.audio } });
        } catch (error) {
            await sock.sendMessage(id, { text: error.message });
        }
    },
    'igv': async (id, sock, psn) => await plugins['meta'](id, sock, psn),
    'fd': async (id, sock, psn) => await plugins['meta'](id, sock, psn),
    'meta': async (id, sock, psn) => {
        try {
            await sock.sendMessage(id, { text: 'Processing, please wait...' });
            let result = await meta(psn);
            await sock.sendMessage(id, { video: { url: result } });
        } catch (error) {
            await sock.sendMessage(id, { text: error.message });
        }
    },
    'gm': async (id, sock, psn) => {
        if (psn === '') {
            sock.sendMessage(id, { text: "Tanyakan sesuatu kepada Gemini" })
            return
        }
        await sock.sendMessage(id, { text: await gemini(psn) });
    },
    'mistral': async (id, sock, psn) => {
        if (psn === '') {
            sock.sendMessage(id, { text: "Tanyakan sesuatu kepada Mistral" })
            return
        }
        await sock.sendMessage(id, { text: await mistral(psn) });
    },
    'mixtral': async (id, sock, psn) => {
        if (psn === '') {
            sock.sendMessage(id, { text: "Tanyakan sesuatu kepada Mixtral" })
            return
        }
        await sock.sendMessage(id, { text: await mixtralGroq(psn) });
    },
    'llama': async (id, sock, psn) => {
        if (psn === '') {
            sock.sendMessage(id, { text: "Tanyakan sesuatu kepada Llama" })
            return
        }
        await sock.sendMessage(id, { text: await llamaGroq(psn) });
    },
    'gemma': async (id, sock, psn) => {
        if (psn === '') {
            sock.sendMessage(id, { text: "Tanyakan sesuatu kepada Gemma" })
            return
        }
        await sock.sendMessage(id, { text: await gemmaGroq(psn) });
    },
    'cerpen': async (id, sock) => await sock.sendMessage(id, { text: await cerpen() }),
    'help': async (id, sock, sender) => {
        try {
            await sock.sendMessage(id, { image: { url: `https://api.lolhuman.xyz/api/ephoto1/hologram3d?text=${sender}&apikey=${config.apikey}` }, caption: await helpMessage(sender) });
        } catch (error) {
            await sock.sendMessage(id, { text: await helpMessage(sender) });
        }
    },
    'menu': async (id, sock, sender) => await plugins['help'](id, sock, sender),
    'h': async (id, sock, sender) => await plugins['help'](id, sock, sender)
}

bot.start().then((sock) => {
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            let m = chatUpdate.messages[0];
            await sticker(sock, m, chatUpdate);
            await removebg(sock, m, chatUpdate)
            await gambarPdf(sock, m, chatUpdate)
            await tomp3(sock, m, chatUpdate)

            if (!m.message) return;
            const chat = await clearMessages(m);

            let parsedMsg, sender, id, quotedMessageId;
            if (!chat) return;
            if (chat.chatsFrom === "private") {
                parsedMsg = chat.message
                sender = chat.pushName || chat.remoteJid
                id = chat.remoteJid
                quotedMessageId = m;
            } else if (chat.chatsFrom === "group") {
                console.log(chat)
                parsedMsg = chat.participant.message
                sender = chat.participant.pushName || chat.participant.number
                id = chat.remoteJid
                quotedMessageId = m;
            }
            let pesan = parsedMsg.split(' ');
            const cmd = pesan[0].toLowerCase();
            pesan.shift();
            const psn = pesan.join(' ');

            if (tebakSession.has(id)) {
                if (m.key.fromMe) return
                await checkAnswer(id, parsedMsg.toLowerCase(), sock, quotedMessageId);
            } else {
                if (plugins[cmd]) {
                    await plugins[cmd](id, sock, psn, sender, m);
                }
            }
        } catch (error) {
            console.log('_Ups, ada yang salah, silahkan coba beberapa saat lagi_', error)
        }
    })
    sock.ev.on('call', async (ev) => {
        call(ev, sock)
    });
    sock.ev.on('group-participants.update', async (ev) => {
        groupParticipants(ev, sock)
    });

    sock.ev.on('groups.update', async (ev) => {
        groupUpdate(ev, sock);
    });
}).catch(error => console.log("Error starting Bot :", error))