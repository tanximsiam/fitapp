import type { WatchBindings, WatchLink, WatchTransport } from './bindings'

/**
 * An in-memory watch and its bindings, used only by tests to exercise the connection layer end to end.
 * The handshake is a toy challenge/response, not any real device's protocol. Never registered in the app,
 * so simulated readings can never reach a real account.
 */

const SVC = '0000fa00-0000-1000-8000-00805f9b34fb'
const AUTH = '0000fa01-0000-1000-8000-00805f9b34fb'
const DATA = '0000fa02-0000-1000-8000-00805f9b34fb'

const enc = (s: string) => new TextEncoder().encode(s)
const dec = (b: Uint8Array) => new TextDecoder().decode(b)

export function simulatedWatch(opts: { model?: string; acceptPairing?: boolean } = {}) {
  let paired: string | null = null
  let challenge = ''
  let lastReply = ''
  const log: string[] = []

  const link: WatchLink = {
    async write(_s, c, data) {
      const msg = dec(data)
      log.push(`write ${c === AUTH ? 'auth' : 'data'} ${msg.split(':')[0]}`)
      if (msg === 'pair') {
        if (opts.acceptPairing === false) lastReply = 'refused'
        else {
          paired = `key-${Math.random().toString(36).slice(2)}`
          lastReply = `paired:${paired}`
        }
      } else if (msg === 'hello') {
        challenge = Math.random().toString(36).slice(2)
        lastReply = `challenge:${challenge}`
      } else if (msg.startsWith('proof:')) lastReply = paired && msg === `proof:${paired}:${challenge}` ? 'ok' : 'refused'
    },
    read: async () => enc(lastReply),
    subscribe: async () => async () => {},
    disconnect: async () => void log.push('disconnect'),
  }

  const transport: WatchTransport = {
    ready: async () => ({ ok: true }),
    scan: async () => [{ id: 'sim-1', name: opts.model ?? 'FitApp Watch (simulated)' }],
    connect: async () => link,
  }

  const ask = async (msg: string) => {
    await link.write(SVC, AUTH, enc(msg))
    return dec(await link.read(SVC, AUTH))
  }

  const bindings: WatchBindings = {
    key: 'fitapp-watch',
    name: 'FitApp watch',
    scanFilter: { services: [SVC] },
    provides: ['steps', 'heart_rate'],
    async handshake(l, secret) {
      if (!secret) {
        const reply = await ask('pair')
        if (!reply.startsWith('paired:')) throw new Error('The watch refused pairing.')
        secret = reply.slice('paired:'.length)
      }
      const c = (await ask('hello')).slice('challenge:'.length)
      if ((await ask(`proof:${secret}:${c}`)) !== 'ok') throw new Error('The watch did not accept this phone.')
      return { identity: { device: opts.model ?? 'FitApp Watch (simulated)' }, secret }
    },
    async read(l, from, _to, only) {
      await l.write(SVC, DATA, enc('sync'))
      const date = from.toISOString().slice(0, 10)
      return {
        ...(only.includes('steps') ? { activity: [{ date, steps: 4321 }] } : {}),
        ...(only.includes('heart_rate') ? { heart_rate: { samples: [{ at: from.toISOString(), bpm: 64 }] } } : {}),
      }
    },
  }

  return { transport, bindings, log, isPaired: () => paired !== null }
}
