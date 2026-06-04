import fs from 'fs'

const MEMORY_FILE = './memoria.json'
const HISTORY_FILE = './historial.json'
const MAX_HISTORY = 20 // mensajes en RAM
const SUMMARIZE_EVERY = 10 // cada cuántos mensajes resume

// En RAM
let memoria = ''
let historial = []
let mensajesDesdeUltimoResumen = 0

// Carga al arrancar
export function loadMemory() {
    if (fs.existsSync(MEMORY_FILE)) {
        memoria = fs.readFileSync(MEMORY_FILE, 'utf-8')
    }
    if (fs.existsSync(HISTORY_FILE)) {
        historial = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'))
    }
}

export function getMemoryPrompt() {
    if (!memoria) return ''
    return `\nWhat you remember about the user:\n${memoria}\n`
}

export function getHistory() {
    return historial
}

export function addMessage(role, content) {
    historial.push({ role, content })
    mensajesDesdeUltimoResumen++

    // Mantiene solo los últimos MAX_HISTORY
    if (historial.length > MAX_HISTORY) {
        historial = historial.slice(-MAX_HISTORY)
    }
}

export function shouldSummarize() {
    return mensajesDesdeUltimoResumen >= SUMMARIZE_EVERY
}

export function updateMemory(newSummary) {
    memoria = newSummary
    mensajesDesdeUltimoResumen = 0
    fs.writeFileSync(MEMORY_FILE, memoria)
}

export function saveHistory() {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(historial, null, 2))
}

// Guarda al cerrar el proceso
process.on('exit', saveHistory)
process.on('SIGINT', () => { saveHistory(); process.exit() })