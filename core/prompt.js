import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const template = fs.readFileSync(path.join(root, 'prompts/system.md'), 'utf-8')

function render(templateText, vars) {
    return Object.entries(vars).reduce(
        (text, [key, value]) => text.replaceAll(`{{${key}}}`, String(value)),
        templateText
    )
}

export function buildSystemMessage(vars = {}) {
    const resolved = {
        todayDate: new Date().toString(),
        ...vars,
    }

    return {
        role: 'system',
        content: render(template, resolved),
    }
}
