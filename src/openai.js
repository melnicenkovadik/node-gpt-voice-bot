import {Configuration, OpenAIApi} from 'openai';
import {createReadStream} from "fs";
import {envConst} from "./utils.js";

class OpenAi {
    roles = {
        ASSISTANT: 'assistant',
        USER: 'user',
        SYSTEM: 'system'
    }
    constructor(apiKey) {
        console.log('apiKey',apiKey);
        const configuration = new Configuration({
            apiKey:String(apiKey),
        });
        this.openai = new OpenAIApi(configuration);

    }

    async chat(messages) {
        try {
            console.log('start',messages);
            const response = await this.openai.createChatCompletion({
                model:'gpt-3.5-turbo',
                messages
            })
            console.log('response',response);
            return response?.data?.choices?.[0]?.message || 'Не удалось получить ответ'
        }catch (e) {
            console.error('Error while chat', e?.message)
            return e.message
        }
    }

    async transcription(filepath) {
        try {
            const response = await this.openai.createTranscription(createReadStream(filepath), 'whisper-1')
            return response.data.text || 'Не удалось распознать сообщение'
        } catch (e) {
            console.error('Error while transcription', e?.message)
            return e.message
        }
    }
}

export const openai = new OpenAi(envConst.OPENAI_KEY);
