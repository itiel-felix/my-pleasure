import OpenAI from 'openai'
import dotenv from 'dotenv'
import { executeTool } from './tools/executor.js'
import { tools } from './tools.js'
dotenv.config()

const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
})

const memory = []

const systemPrompt = {
    role: 'system',
    content: `
      Today is: ${new Date().toString()}
      You are a personal assistant.
      Critical: All dates must be YYYY-MM-DD, times HH:MM.
      If no tool is needed, respond normally in text.

      When the user clearly ends the conversation (goodbye, or implicit like "eso es todo", "listo", "nada más", "ya está" with no new request), include one brief farewell in your reply ['hasta luego', 'adiós', 'bye', 'chao', 'hasta pronto', 'que te vaya bien', 'cuídate mucho'].
      If you ar gonna ask a question, do not use a farewell.
      Do not use a farewell after a normal answer if they might keep talking.

      Critical: At the end of every response, append exactly one meta tag with both fields:
      <meta>{"question": true|false, "end": true|false}</meta>
      - question: true if you asked the user something and expect an answer.
      - end: true only when the user clearly ended the conversation (goodbye or implicit closure).
      
    `
}

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
        messages: [systemPrompt, ...memory],
        tools,
        tool_choice: 'auto',
    })

    const message = response.choices[0].message

    // If the assistant is going to use a tool, we need to execute the tool and get the result
    let followUp = null
    const llmWillUseTool = message.tool_calls && message.tool_calls.length > 0
    memory.push(message)
    if (llmWillUseTool) {

        for (const toolCall of message.tool_calls) {
            const args = JSON.parse(toolCall.function.arguments)
            const result = await executeTool(toolCall.function.name, args)
            memory.push({ role: 'tool', tool_call_id: toolCall.id, content: result })
        }

        followUp = await client.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages: [systemPrompt, ...memory],
            tools,
            tool_choice: 'none',
        })
    }

    const rawReply = llmWillUseTool ? followUp.choices[0].message.content : message.content
    const { reply, isQuestion, hasEnded } = processReply(rawReply)
    console.log(`\nAsistente: ${reply}\n`)

    return { reply, isQuestion, hasEnded }

}