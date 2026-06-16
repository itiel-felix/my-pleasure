import { getTasksClient } from './google-auth.js'

async function getAllTaskLists(client) {
    const { data } = await client.tasklists.list({ maxResults: 100 })
    return data.items ?? []
}

async function getTaskListById(client, listId) {
    const lists = await getAllTaskLists(client)
    return lists.find(l => l.id === listId) ?? null
}

export async function listTaskLists() {
    const client = await getTasksClient()
    const lists = await getAllTaskLists(client)

    if (!lists.length) return 'No task lists found.'

    return lists.map(l => `- id: ${l.id} | title: ${l.title}`).join('\n')
}

export async function listTasks({ list_id }) {
    const client = await getTasksClient()

    const list = await getTaskListById(client, list_id)
    if (!list) return `No list found with id "${list_id}". Call list_task_lists first.`

    const { data } = await client.tasks.list({
        tasklist: list_id,
        showCompleted: true,
        maxResults: 100,
    })
    const tasks = data.items ?? []

    if (!tasks.length) return `No tasks in "${list.title}".`

    return tasks
        .map(t => `- id: ${t.id} | title: ${t.title} | status: ${t.status ?? 'needsAction'}`)
        .join('\n')
}

export async function createTaskList({ list_title }) {
    const client = await getTasksClient()
    const lists = await getAllTaskLists(client)

    const exists = lists.find(l => l.title.toLowerCase() === list_title.toLowerCase().trim())
    if (exists) {
        return `The list "${exists.title}" already exists (id: ${exists.id}).`
    }

    const { data } = await client.tasklists.insert({
        requestBody: { title: list_title },
    })

    return `List "${data.title}" created (id: ${data.id}).`
}

export async function addTaskToList({ list_id, task_title }) {
    const client = await getTasksClient()

    const list = await getTaskListById(client, list_id)
    if (!list) return `No list found with id "${list_id}". Call list_task_lists first.`

    const { data } = await client.tasks.insert({
        tasklist: list_id,
        requestBody: { title: task_title },
    })

    return `"${task_title}" added to "${list.title}" (task id: ${data.id}).`
}

export async function completeTask({ list_id, task_id }) {
    const client = await getTasksClient()

    const list = await getTaskListById(client, list_id)
    if (!list) return `No list found with id "${list_id}". Call list_task_lists first.`

    const { data: task } = await client.tasks.get({ tasklist: list_id, task: task_id })

    if (task.status === 'completed') {
        return `"${task.title}" is already completed.`
    }

    await client.tasks.patch({
        tasklist: list_id,
        task: task_id,
        requestBody: { status: 'completed' },
    })

    return `"${task.title}" marked as completed in "${list.title}".`
}

export async function deleteTask({ list_id, task_id }) {
    const client = await getTasksClient()

    const list = await getTaskListById(client, list_id)
    if (!list) return `No list found with id "${list_id}". Call list_task_lists first.`

    const { data: task } = await client.tasks.get({ tasklist: list_id, task: task_id })

    await client.tasks.delete({ tasklist: list_id, task: task_id })

    return `"${task.title}" deleted from "${list.title}".`
}
