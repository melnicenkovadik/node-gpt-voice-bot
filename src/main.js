import {Telegraf, session} from "telegraf";
import config from "config";
import {message} from "telegraf/filters";
import {ogg} from "./ogg.js";
import {openai} from "./openai.js";
import {code} from "telegraf/format";

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))

const INITIAL_SESSION = {
    messages: [],
};

bot.command('new', async (ctx) => {
    ctx.deleteMessage();
    ctx.session = INITIAL_SESSION
    await ctx.reply(code('Жду Вашего текстового или голосового сообщения'))
})

bot.command('start', async (ctx) => {
    ctx.deleteMessage();
    ctx.session = INITIAL_SESSION
    await ctx.reply(code('Жду Вашего текстового или голосового сообщения'))
})

bot.command('help', async (ctx) => {
    ctx.deleteMessage();
    await ctx.reply('/new и /start - начать новый диалог')
    await ctx.reply('/help - показать эту справку')
    await ctx.reply('/info - показать информацию о боте')
    await ctx.reply('/about - показать информацию о боте')

})

bot.command('about', async (ctx) => {
    ctx.deleteMessage();
    await ctx.reply(code('Чтобы начать диалог с ботом, отправьте ему голосовое или текстовое сообщение'))
    await ctx.reply(code('Бот не умеет отвечать на вопросы, заданные картинкой, но умеет на голосовое и текстовое'))
    await ctx.reply(code('Бот не хранит историю диалогов на своих серверах, а берет ее из телеграма'))
    await ctx.reply(code('Приятного общения!'))
})

bot.command('info', async (ctx) => {
    ctx.deleteMessage();
    await ctx.reply(code('Бот не умеет отвечать на вопросы, заданные картинкой, но умеет на голосовое и текстовое'))
    await ctx.reply(code('Бот не хранит историю диалогов на своих серверах, а берет ее из телеграма'))
    await ctx.reply(code('Все сообщения, которые вы отправляете боту, он отправляет в сервис openai, а затем отправляет вам ответ'))
    await ctx.reply(code('Приятного общения!'))
})


bot.on(message('voice'), async (ctx) => {
    ctx.session ??= INITIAL_SESSION
    try {
        await ctx.reply(code('Сообщение принято, обрабатываю...'))
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
        const userId = String(ctx.message.from.id)
        const oggPath = await ogg.create(link.href, userId)
        const mp3Path = await ogg.toMp3(oggPath, userId)

        const text = await openai.transcription(mp3Path)
        await ctx.reply(code(`Ваше сообщение: ${text}`))
        ctx.session.messages.push({role: openai.roles.USER, content: text})
        const response = await openai.chat(ctx.session.messages)
        ctx.session.messages.push({role: openai.roles.ASSISTANT, content: response.content})

        await ctx.reply(response?.content || 'Не удалось обработать сообщение')

    } catch (e) {
        console.error('Error while processing voice message', e?.message)
    }
})


bot.on(message('text'), async (ctx) => {
    ctx.session ??= INITIAL_SESSION
    try {
        ctx.session.messages.push({role: openai.roles.USER, content: ctx.message.text})
        const response = await openai.chat(ctx.session.messages)
        ctx.session.messages.push({role: openai.roles.ASSISTANT, content: response.content})
        await ctx.reply(response?.content || 'Не удалось обработать сообщение')
    } catch (e) {
        console.error('Error while processing text message', e?.message)
    }
})


bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
