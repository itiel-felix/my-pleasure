import { agregarItem, verLista } from './shopping.js'
import { agregarEvento, verEventos, eliminarEvento } from './calendar.js'
export async function executeTool(name, args) {
    switch (name) {
        case 'add_shopping_item':
            return agregarItem(args.item)
        case 'get_shopping_list':
            return verLista()
        case 'add_calendar_event':
            return agregarEvento(args)
        case 'list_calendar_events':
            return verEventos(args)
        case 'delete_calendar_event':
            return eliminarEvento(args)
        default:
            return 'Unknown tool.'
    }
}