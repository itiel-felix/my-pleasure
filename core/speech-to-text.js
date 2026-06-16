import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const python = path.join(root, 'venv/bin/python')
const script = path.join(root, 'speech-to-text.py')

let sttProcess = null
let readyPromise = null
let lineBuffer = ''
let pendingResolve = null
let pendingReject = null

function handleStdoutLine(line) {
    const trimmed = line.trim()
    if (!trimmed || trimmed === 'READY') return

    let msg
    try {
        msg = JSON.parse(trimmed)
    } catch {
        return
    }

    if (msg.status === 'listening') {
        console.log('👂 Escuchando... (habla ahora)')
        return
    }

    if (!pendingResolve) return

    if (msg.error) {
        pendingReject(new Error(msg.error))
    } else if ('text' in msg) {
        pendingResolve(msg.text ?? '')
    } else {
        return
    }

    pendingResolve = null
    pendingReject = null
}

/** Arranca Vosk al levantar la app (sin grabar aún). */
export function startSttServer() {
    return ensureSttServer().then(() => {
        console.log('✅ Transcripción Vosk lista (Python)\n')
    })
}

function ensureSttServer() {
    if (readyPromise) return readyPromise

    readyPromise = new Promise((resolve, reject) => {
        let serverReady = false

        sttProcess = spawn(python, [script, '--server'], {
            cwd: root,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env },
        })

        sttProcess.stdout.on('data', (chunk) => {
            lineBuffer += chunk.toString()
            const lines = lineBuffer.split('\n')
            lineBuffer = lines.pop() ?? ''
            for (const line of lines) {
                if (!serverReady && line.trim() === 'READY') {
                    serverReady = true
                    resolve()
                    continue
                }
                handleStdoutLine(line)
            }
        })

        sttProcess.stderr.on('data', (data) => {
            process.stderr.write(`[stt] ${data}`)
        })

        sttProcess.on('error', (err) => {
            readyPromise = null
            reject(err)
        })

        sttProcess.on('close', () => {
            sttProcess = null
            readyPromise = null
            if (pendingReject) pendingReject(new Error('Proceso STT terminó'))
        })
    })

    return readyPromise
}

/** Activa una escucha en Python; devuelve el texto transcrito. Sin Groq ni ffmpeg. */
export async function listenAndTranscribe({ maxSilenceSeconds }) {
    await ensureSttServer()

    return new Promise((resolve, reject) => {
        pendingResolve = resolve
        pendingReject = reject
        sttProcess.stdin.write(
            JSON.stringify({ max_silence: maxSilenceSeconds }) + '\n'
        )
    })
}
