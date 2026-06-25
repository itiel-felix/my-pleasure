export const tools = [
    {
        type: 'function',
        function: {
            name: 'add_shopping_item',
            description: 'Add an item to the shopping list',
            parameters: {
                type: 'object',
                properties: {
                    item: { type: 'string', description: 'El producto a agregar' },
                },
                required: ['item'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_shopping_list',
            description: 'Show the current shopping list',
            parameters: { type: 'object', properties: {} },
        },
    },
    {
        type: 'function',
        function: {
            name: 'add_calendar_event',
            description: `
            Add an event or reminder to Google Calendar.
            If the user mentions tasks related to an event (like getting money, preparing something), add them to the event description instead of creating separate events.
            Given time must be logical. 
                Example: if the user says "I need to get money for the event", the time should be the time of the event.
                Example: if the user says "I will go to a party at 10:00", the time should be 10:00 PM unless the user specifies otherwise.
                Example: If the user says "I will go to supermarket at 10:00", and the call is for tomorrow, its before 10:00 AM the time should be 10:00 AM unless the user specifies otherwise.`,
            parameters: {
                type: 'object',
                properties: {
                    titulo: { type: 'string', description: 'Event title' },
                    fecha: { type: 'string', description: 'Date in format YYYY-MM-DD' },
                    hora: { type: 'string', description: 'Time in format HH:MM, optional' },
                    horaFin: { type: 'string', description: 'Time in format HH:MM, required if hora is provided.' },
                    descripcion: { type: 'string', description: 'Optional event description' },
                },
                required: ['titulo', 'fecha'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'list_calendar_events',
            description: 'Show the next events from Google Calendar',
            parameters: { type: 'object', properties: {} },
        },
    },
    {
        type: 'function',
        function: {
            name: 'delete_calendar_event',
            description: 'Delete an event from Google Calendar. Generate 2-3 keyword variants separated in an array. For example: "play billiards tonight" → ["billar", "billares", "pool"]',
            parameters: {
                type: 'object',
                properties: {
                    titulo: { type: 'string', description: 'Event title' },
                },
                required: ['titulo'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'list_task_lists',
            description: 'List all Google Tasks lists with their ids. Call this before other task tools when the user refers to a list by name, so you can pick the correct list_id.',
            parameters: { type: 'object', properties: {} },
        },
    },
    {
        type: 'function',
        function: {
            name: 'list_tasks',
            description: 'List all tasks in a Google Tasks list with their ids and status. Call this before complete_task or delete_task so you can pick the correct task_id.',
            parameters: {
                type: 'object',
                properties: {
                    list_id: { type: 'string', description: 'Task list id from list_task_lists' },
                },
                required: ['list_id'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'create_task_list',
            description: 'Create a new Google Tasks list',
            parameters: {
                type: 'object',
                properties: {
                    list_title: { type: 'string', description: 'Name of the new list' },
                },
                required: ['list_title'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'add_task_to_list',
            description: 'Add a task to a Google Tasks list. Call list_task_lists first to resolve list_id from the user\'s list name.',
            parameters: {
                type: 'object',
                properties: {
                    list_id: { type: 'string', description: 'Task list id from list_task_lists' },
                    task_title: { type: 'string', description: 'Task to add' },
                },
                required: ['list_id', 'task_title'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'complete_task',
            description: 'Mark a task as completed. Call list_task_lists and list_tasks first to resolve list_id and task_id from what the user said.',
            parameters: {
                type: 'object',
                properties: {
                    list_id: { type: 'string', description: 'Task list id from list_task_lists' },
                    task_id: { type: 'string', description: 'Task id from list_tasks' },
                },
                required: ['list_id', 'task_id'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'delete_task',
            description: 'Delete a task from a Google Tasks list. Call list_task_lists and list_tasks first to resolve list_id and task_id from what the user said.',
            parameters: {
                type: 'object',
                properties: {
                    list_id: { type: 'string', description: 'Task list id from list_task_lists' },
                    task_id: { type: 'string', description: 'Task id from list_tasks' },
                },
                required: ['list_id', 'task_id'],
            },
        },
    },
]