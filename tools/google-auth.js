import { google } from 'googleapis'
import fs from 'fs'
import readline from 'readline'

const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/tasks',
]
const TOKEN_PATH = './token.json'
const CREDENTIALS_PATH = './credentials.json'

function loadToken() {
    if (!fs.existsSync(TOKEN_PATH)) return null
    return JSON.parse(fs.readFileSync(TOKEN_PATH))
}

function saveToken(token) {
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2))
}

function deleteToken() {
    if (fs.existsSync(TOKEN_PATH)) fs.unlinkSync(TOKEN_PATH)
}

function tokenHasRequiredScopes(token) {
    const granted = (token.scope ?? '').split(' ').filter(Boolean)
    return SCOPES.every(scope => granted.includes(scope))
}

function isAccessTokenValid(token) {
    if (!token?.access_token || !token.expiry_date) return false
    // 60s buffer before expiry
    return Date.now() < token.expiry_date - 60_000
}

function isRefreshTokenExpired(token) {
    if (!token?.refresh_token) return true
    if (!token.refresh_token_expires_in) return false
    // Google sets this when the refresh token has a limited lifetime (Testing mode ≈ 7 days)
    const issuedAt = token.expiry_date - 3_600_000
    const expiresAt = issuedAt + token.refresh_token_expires_in * 1000
    return Date.now() >= expiresAt
}

function createOAuth2Client() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH))
    const { client_secret, client_id, redirect_uris } = credentials.installed
    const client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])

    client.on('tokens', (tokens) => {
        const current = loadToken() ?? {}
        saveToken({ ...current, ...tokens })
    })

    return client
}

async function authorize(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
        include_granted_scopes: true,
    })
    console.log('\nAbre este link en tu navegador:\n', authUrl)

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const code = await new Promise(resolve => rl.question('\nPega el código aquí: ', resolve))
    rl.close()

    const { tokens } = await oAuth2Client.getToken(code)
    oAuth2Client.setCredentials(tokens)
    saveToken(tokens)

    return oAuth2Client
}

async function ensureValidAuth(oAuth2Client) {
    const token = loadToken()

    if (!token || !tokenHasRequiredScopes(token)) {
        if (token && !tokenHasRequiredScopes(token)) {
            console.log('\nEl token no incluye todos los permisos necesarios. Vuelve a autorizar.\n')
        }
        deleteToken()
        return authorize(oAuth2Client)
    }

    if (isRefreshTokenExpired(token)) {
        console.log('\nEl refresh token expiró (común en apps OAuth en modo Testing: ~7 días). Vuelve a autorizar.\n')
        deleteToken()
        return authorize(oAuth2Client)
    }

    oAuth2Client.setCredentials(token)

    if (isAccessTokenValid(token)) {
        return oAuth2Client
    }

    try {
        await oAuth2Client.getAccessToken()
        return oAuth2Client
    } catch (err) {
        const revoked = err.message?.includes('invalid_grant')
        console.log(
            revoked
                ? '\nEl token de Google expiró o fue revocado. Vuelve a autorizar.\n'
                : `\nError al renovar el token de Google: ${err.message}\n`
        )
        deleteToken()
        return authorize(oAuth2Client)
    }
}

async function getAuthClient() {
    const oAuth2Client = createOAuth2Client()
    return ensureValidAuth(oAuth2Client)
}

export async function getCalendarClient() {
    const auth = await getAuthClient()
    return google.calendar({ version: 'v3', auth })
}

export async function getTasksClient() {
    const auth = await getAuthClient()
    return google.tasks({ version: 'v1', auth })
}

/** @returns {{ accessTokenValid: boolean, refreshTokenExpired: boolean, scopes: string[] }} */
export function getTokenStatus() {
    const token = loadToken()
    if (!token) {
        return { accessTokenValid: false, refreshTokenExpired: true, scopes: [] }
    }
    return {
        accessTokenValid: isAccessTokenValid(token),
        refreshTokenExpired: isRefreshTokenExpired(token),
        scopes: (token.scope ?? '').split(' ').filter(Boolean),
    }
}
