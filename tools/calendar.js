import { getCalendarClient } from './google-auth.js'

export async function agregarEvento({ titulo, fecha, hora, horaFin, descripcion = '' }) {
    const calendar = await getCalendarClient()

    const horaEvento = hora || '09:00'
    const fechaHora = new Date(`${fecha}T${horaEvento}:00`)
    let fechaFin;
    if (horaFin) {
        fechaFin = new Date(`${fecha}T${horaFin}:00`)
    } else {
        fechaFin = new Date(fechaHora.getTime() + 60 * 60 * 1000) // + 1 hour
    }
    if (Number.isNaN(fechaHora.getTime())) {
        throw new Error('Fecha u hora inválida. Usa formato YYYY-MM-DD y HH:mm.')
    }

    console.log('fechaHora', fechaHora)
    console.log('fechaFin', fechaFin)

    const evento = {
        summary: titulo,
        description: descripcion,
        start: { dateTime: fechaHora.toISOString(), timeZone: 'America/Tijuana' },
        end: { dateTime: fechaFin.toISOString(), timeZone: 'America/Tijuana' },
    }

    const res = await calendar.events.insert({
        calendarId: 'primary',
        resource: evento,
    })

    return `Evento "${titulo}" creado para el ${fecha} a las ${horaEvento}.`
}

export async function eliminarEvento({ titulo }) {
    const calendar = await getCalendarClient()

    const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
        q: titulo,
    })

    const eventos = res.data.items
    if (!eventos.length) return `No encontré ningún evento con "${titulo}".`

    const evento = eventos[0]
    await calendar.events.delete({
        calendarId: 'primary',
        eventId: evento.id,
    })

    return `Evento "${evento.summary}" eliminado.`
}

export async function verEventos({ titulo = '' }) {
    const calendar = await getCalendarClient()

    const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 5,
        singleEvents: true,
        orderBy: 'startTime',
        q: titulo,
    })

    const eventos = res.data.items
    if (!eventos.length) return 'No tienes eventos próximos.'

    return eventos.map(e => {
        const fecha = e.start.dateTime || e.start.date
        return `• ${e.summary} — ${new Date(fecha).toLocaleString('es-MX')}`
    }).join('\n')
}