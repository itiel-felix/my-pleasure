import fs from 'fs'

const FILE = './shopping.json'

function load() {
    if (!fs.existsSync(FILE)) return []
    return JSON.parse(fs.readFileSync(FILE, 'utf-8'))
}

function save(list) {
    fs.writeFileSync(FILE, JSON.stringify(list, null, 2))
}

export function agregarItem(item) {
    const list = load()
    list.push({ item, fecha: new Date().toISOString() })
    save(list)
    return `"${item}" agregado a la lista.`
}

export function verLista() {
    const list = load()
    if (list.length === 0) return 'La lista está vacía.'
    return list.map((e, i) => `${i + 1}. ${e.item}`).join('\n')
}