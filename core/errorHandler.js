import fs from 'fs'
import path from 'path'

export function logError(error, context = '') {
    const timestamp = new Date().toISOString()
    const logEntry = {
        timestamp,
        context,
        message: error.message,
        stack: error.stack,
        details: error.error || null,
    }

    const filename = `errors/${timestamp.replace(/[:.]/g, '-')}.json`
    fs.writeFileSync(filename, JSON.stringify(logEntry, null, 2))
    console.error(`\n❌ Error [${timestamp}]: ${error.message}`)
    console.error(`   Log guardado en ${filename}\n`)
}