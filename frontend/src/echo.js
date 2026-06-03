import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { api } from './api/client.js';
import { COMM } from './comunicacao.js';

window.Pusher = Pusher;

let echoInstance = null;

// Chave do app Reverb (em produção entra como build-arg VITE_REVERB_APP_KEY).
const REVERB_KEY = import.meta.env.VITE_REVERB_APP_KEY;

/**
 * Instância única do Echo conectada ao Reverb (host/porta conforme o ambiente).
 * Retorna null se não houver chave configurada — nesse caso o dashboard usa só polling.
 */
export function getEcho() {
  if (!REVERB_KEY) return null;
  if (echoInstance) return echoInstance;

  const { host, port, scheme } = COMM.ws;

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: REVERB_KEY,
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === 'wss',
    enabledTransports: ['ws', 'wss'],
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        api
          .post('/broadcasting/auth', {
            socket_id: socketId,
            channel_name: channel.name,
          })
          .then((r) => callback(null, r.data))
          .catch((e) => callback(e, null));
      },
    }),
  });

  return echoInstance;
}

export function disconnectEcho() {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}
