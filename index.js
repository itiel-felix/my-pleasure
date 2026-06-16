import 'dotenv/config'
import net from 'net'
import { chat } from './agent.js'
import { listenAndTranscribe, startSttServer } from './core/speech-to-text.js'
let isProcessing = false
let maxSilenceSeconds = 1.5
async function handleWakeWord(socket) {
    if (isProcessing) return
    isProcessing = true

    console.log('🎤 Wake word detectado!')

    while (true) {
        let texto
        try {
            texto = await listenAndTranscribe({ maxSilenceSeconds })
        } catch (err) {
            console.error('\n❌ Error de transcripción:', err.message)
            break
        }
        if (!texto || texto.trim() === '') break

        console.log(`\nTú: ${texto}`)

        const palabrasSalida = ['adiós', 'hasta luego', 'bye', 'chao']
        if (palabrasSalida.some(p => texto.toLowerCase().includes(p))) break

        const { hasEnded, isQuestion } = await chat(texto)
        if (hasEnded) {
            maxSilenceSeconds = 1.5
            break
        }
        if (isQuestion) maxSilenceSeconds = 5
    }

    console.log('💤 Volviendo a escuchar wake word...\n')
    await new Promise(resolve => setTimeout(resolve, 2000))
    socket.write('DONE') // ← avisa a Python
    isProcessing = false
}

// Servidor socket que escucha a Python
const server = net.createServer((socket) => {
    socket.on('data', async (data) => {
        if (data.toString().trim() === 'WAKE') {
            await handleWakeWord(socket)
        }
    })
})

server.listen(9001, async () => {
    try {
        await startSttServer()
        console.log('🤖 Asistente listo. Di "Hey Jarvis" para activar.\n')
    } catch (err) {
        console.error('No se pudo iniciar Vosk:', err.message)
        process.exit(1)
    }
})