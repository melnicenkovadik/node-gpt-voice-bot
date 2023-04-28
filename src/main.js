import {Telegraf} from "telegraf";
import config from "config";
import {message} from "telegraf/filters";
import {ogg} from "./ogg.js";
import {openai} from "./openai.js";
import {code} from "telegraf/format";
import {removeFile} from "./utils.js";

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))

let INITIAL_SESSION = {
    messages: [
        {
            role: openai.roles.SYSTEM,
            content: ''
        }
    ],
};

bot.command('new', async (ctx) => {
    INITIAL_SESSION.messages = [
        {
            role: openai.roles.SYSTEM,
            content: `
                    For user its a chat with bot, but for bot its a chat with user; 
                    USER thinks the bot can remember the chat history. The bot receives the entire history of correspondence in each message and must respond as if it were not the first time it was talking to the user;
                    
               1. info about bot:
               bot name: Snow(Сноу);
               bot was created by: Vadym Melnychenko (Вадим Мельниченко) (https://t.me/avokadikvadik);
               Snow is Vadym's cat; 
               2. information about USER:
                USER name is: ${ctx.message?.from?.first_name || ''} ${ctx.message?.from?.last_name || ''};
                USER id is: ${ctx.message.from.id};
                USER username is: ${ctx.message.from.username || ''};
                USER language is: ${ctx.message.from.language_code || ''};
                Prefer answer for USER on his language from 'USER language is:' field;
                Prefer answer for USER by his name from 'USER name is:' field;
                If the user asked to contact him / call him by name, then the bot will do so or any other name which user will send with proposal to call him;
               `
        }
    ]
    ctx.deleteMessage();
    ctx.session = INITIAL_SESSION
    await ctx.reply('/help - показать справку')
    await ctx.reply(code('Жду Вашего текстового или голосового сообщения'))
})

bot.command('start', async (ctx) => {
    INITIAL_SESSION.messages = [
        {
            role: openai.roles.SYSTEM,
            content: `
                    For user its a chat with bot, but for bot its a chat with user; 
                    USER thinks the bot can remember the chat history. The bot receives the entire history of correspondence in each message and must respond as if it were not the first time it was talking to the user;
                    
               1. info about bot:
               bot name: Snow(Сноу);
               bot was created by: Vadym Melnychenko (Вадим Мельниченко) (https://t.me/avokadikvadik);
               Snow is Vadym's cat; 
               2. information about USER:
                USER name is: ${ctx.message?.from?.first_name || ''} ${ctx.message?.from?.last_name || ''};
                USER id is: ${ctx.message.from.id};
                USER username is: ${ctx.message.from.username || ''};
                USER language is: ${ctx.message.from.language_code || ''};
                USER chat id is: ${ctx.message.chat.id};
                Prefer answer for USER on his language from 'USER language is:' field;
                Prefer answer for USER by his name from 'USER name is:' field;
                If the user asked to contact him / call him by name, then the bot will do so or any other name which user will send with proposal to call him;
               `
        }
    ]
    ctx.deleteMessage();
    ctx.session = INITIAL_SESSION
    await ctx.reply(code('Жду Вашего текстового или голосового сообщения'))
})

bot.command('help', async (ctx) => {
    ctx.deleteMessage();
    await ctx.reply('/new и /start - начать новый диалог')
    await ctx.reply('/help - показать эту справку')
})

bot.on(message('voice'), async (ctx) => {
    try {
        await ctx.reply(code('Сообщение принято, обрабатываю...'))
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
        const userId = String(ctx.message.from.id)
        const oggPath = await ogg.create(link.href, userId)
        const mp3Path = await ogg.toMp3(oggPath, userId)

        const text = await openai.transcription(mp3Path)
        await ctx.reply(code(`Ваше сообщение: ${text}`))
        INITIAL_SESSION.messages.push({role: openai.roles.USER, content: text})
        const response = await openai.chat(INITIAL_SESSION.messages)
        INITIAL_SESSION.messages.push({role: openai.roles.ASSISTANT, content: response.content})

        const audioFilePath = await ogg.textToMp3(response.content, userId);
        const audio = await ctx.replyWithVoice({source: audioFilePath})

        await ctx.reply(code(response.content) || 'Не удалось обработать сообщение')
        await ctx.reply(audio || 'Не удалось обработать сообщение')
        removeFile(mp3Path)
        removeFile(audioFilePath)
    } catch (e) {
        console.error('Error while processing voice message', e?.message)
    }
})

bot.on(message('text'), async (ctx) => {
    try {
        INITIAL_SESSION.messages.push({role: openai.roles.USER, content: ctx.message.text})
        const response = await openai.chat(INITIAL_SESSION.messages)
        INITIAL_SESSION.messages.push({role: openai.roles.ASSISTANT, content: response.content})
        await ctx.reply(response?.content || 'Не удалось обработать сообщение')
    } catch (e) {
        console.error('Error while processing text message', e?.message)
    }
})
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
