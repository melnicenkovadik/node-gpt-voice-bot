import {unlink} from 'fs/promises';

export async function removeFile(path) {
    try {
        await unlink(path)
    } catch (e) {
        console.error('Error while removing file', e?.message)
    }
}

export const envConst = {
    "OPENAI_KEY": "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",
    "TELEGRAM_TOKEN": "6042716783:AAHlgR248Usna89smxfcshBPPciveZmHskw"
}
