import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import installer from "@ffmpeg-installer/ffmpeg";

import {createWriteStream} from "fs";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";
import {removeFile} from "./utils.js";
import gTTS from "gtts";

const __dirname = dirname(fileURLToPath(import.meta.url));

class OggConverter {
    constructor() {
        ffmpeg.setFfmpegPath(installer.path);
    }

    toMp3(input, output) {
        try {
            const outputPath = resolve(dirname(input), `${output || '2121'}.mp3`)
            return new Promise((resolve, reject) => {
                ffmpeg(input)
                    .inputOption('-t 30')
                    .output(outputPath)
                    .on('end', () => {
                        console.log('convert success')
                        removeFile(input)
                        resolve(outputPath)
                    })
                    .on('error', (err) => {
                    console.error('Error while converting ogg to mp3', err?.message)
                    reject(err)
                })
                    .run()
            })

        } catch (e) {
            console.error('Error while converting ogg to mp3', e?.message)
        }
    }

    textToMp3(text, output) {
        try {
            const outputPath = resolve(__dirname, '../voices', `--${output}.mp3`)
            return new Promise(async (resolve, reject) => {
                const  gtts = new gTTS(text, 'ru');
                gtts.save(outputPath, function (err, result){
                    if(err) {
                        console.error('Error while converting ogg to mp3', err?.message)
                        reject(err)
                    }
                    resolve(outputPath)
                    console.log("Text to speech converted!");
                })
            })

        } catch (e) {
            console.error('Error while converting ogg to mp3', e?.message)
        }
    }

    async create(url, fileName) {
        try {
            const oggPath = resolve(__dirname, '../voices', `${fileName}.ogg`)
            const response = await axios({
                method: 'get',
                url,
                responseType: 'stream'
            })

            return new Promise((resolve, reject) => {
                const stream = createWriteStream(oggPath)
                response.data.pipe(stream)
                stream.on('finish', () => {
                    console.log('create ogg file success userId:' + fileName)
                    resolve(oggPath)
                })
            })

        } catch (e) {
            console.error('Error while creating ogg', e?.message)
        }

    }
}

export const ogg = new OggConverter();
