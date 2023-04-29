import {unlink} from 'fs/promises';

export async function removeFile(path) {
    try {
        await unlink(path)
    } catch (e) {
        console.error('Error while removing file', e?.message)
    }
}

export const env = {
    "OPENAI_KEY": "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",
    "TELEGRAM_TOKEN": "6042716783:AAHlgR248Usna89smxfcshBPPciveZmHskw"
}
