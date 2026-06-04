import { google } from 'googleapis'
import fs from 'fs'
import readline from 'readline'

const SCOPES = ['https://www.googleapis.com/auth/calendar']
const TOKEN_PATH = './token.json'
const CREDENTIALS_PATH = './credentials.json'

export async function getCalendarClient() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH))
    const { client_secret, client_id, redirect_uris } = credentials.installed
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])

    if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH))
        oAuth2Client.setCredentials(token)
        return google.calendar({ version: 'v3', auth: oAuth2Client })
    }

    // Primera vez — autorizar
    const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES })
    console.log('\nAbre este link en tu navegador:\n', authUrl)

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const code = await new Promise(resolve => rl.question('\nPega el código aquí: ', resolve))
    rl.close()

    const { tokens } = await oAuth2Client.getToken(code)
    oAuth2Client.setCredentials(tokens)
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens))

    return google.calendar({ version: 'v3', auth: oAuth2Client })
}