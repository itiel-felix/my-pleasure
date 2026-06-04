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
            description: `Add an event or reminder to Google Calendar.
            If the user mentions tasks related to an event (like getting money, preparing something), add them to the event description instead of creating separate events.`,
            parameters: {
                type: 'object',
                properties: {
                    titulo: { type: 'string', description: 'Event title' },
                    fecha: { type: 'string', description: 'Date in format YYYY-MM-DD' },
                    hora: { type: 'string', description: 'Time in format HH:MM, optional' },
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
]