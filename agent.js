import OpenAI from 'openai'
import dotenv from 'dotenv'
import { buildSystemMessage } from './core/prompt.js'
import { executeTool } from './tools/executor.js'
import { tools } from './tools.js'

dotenv.config()

const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
})

const memory = []

const META_DEFAULTS = { question: false, end: false }

const processReply = (reply) => {
    const meta = [...reply.matchAll(/<meta>(.*?)<\/meta>/g)].reduce(
        (acc, m) => ({ ...acc, ...JSON.parse(m[1]) }),
        { ...META_DEFAULTS }
    )
    const replyLimpio = reply.replace(/<meta>.*?<\/meta>/g, '').trim()
    return { reply: replyLimpio, isQuestion: !!meta.question, hasEnded: !!meta.end }
}

export async function chat(userMessage) {
    memory.push({ role: 'user', content: userMessage })

    const response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL,
        messages: [buildSystemMessage(), ...memory],
        tools,
        tool_choice: 'auto',
    })

    const message = response.choices[0].message

    let followUp = null
    const llmWillUseTool = message.tool_calls && message.tool_calls.length > 0
    memory.push(message)

    if (llmWillUseTool) {
        console.log('llmWillUseTool', llmWillUseTool)

        for (const toolCall of message.tool_calls) {
            const args = JSON.parse(toolCall.function.arguments)
            console.log('Executing tool', toolCall.function.name, args)
            const result = await executeTool(toolCall.function.name, args)
            console.log('Tool result', result)
            memory.push({ role: 'tool', tool_call_id: toolCall.id, content: result })
        }

        followUp = await client.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages: [buildSystemMessage(), ...memory],
            tools,
            tool_choice: 'none',
        })
    }

    const rawReply = llmWillUseTool ? followUp.choices[0].message.content : message.content
    const { reply, isQuestion, hasEnded } = processReply(rawReply)
    console.log(`\nAsistente: ${reply}\n`)

    return { reply, isQuestion, hasEnded }
}
