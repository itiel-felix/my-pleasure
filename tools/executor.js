import { agregarItem, verLista } from './shopping.js'
import { agregarEvento, verEventos, eliminarEvento } from './calendar.js'
export async function executeTool(name, args) {
    switch (name) {
        case 'agregar_lista_compras':
            return agregarItem(args.item)
        case 'ver_lista_compras':
            return verLista()
        case 'agregar_evento_calendario':
            return agregarEvento(args)
        case 'ver_eventos_calendario':
            return verEventos(args)
        case 'eliminar_evento_calendario':
            return eliminarEvento(args)
        default:
            return 'Tool no reconocida.'
    }
}