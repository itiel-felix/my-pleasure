import { agregarItem, verLista } from './shopping.js'
import { agregarEvento, verEventos, eliminarEvento } from './calendar.js'
import { createTaskList, listTaskLists, listTasks, addTaskToList, completeTask, deleteTask } from './tasks.js'

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
        case 'list_task_lists':
            return listTaskLists()
        case 'list_tasks':
            return listTasks(args)
        case 'create_task_list':
            return createTaskList(args)
        case 'add_task_to_list':
            return addTaskToList(args)
        case 'complete_task':
            return completeTask(args)
        case 'delete_task':
            return deleteTask(args)
        default:
            return 'Unknown tool.'
    }
}