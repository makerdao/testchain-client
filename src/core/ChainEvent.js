
export const Event = {
  API_JOIN: 'phx_reply',
  CHAIN_JOIN: 'phx_reply',
  CHAIN_CREATED: 'phx_reply',
  CHAIN_STARTED: 'started',
  CHAIN_DEPLOYING: 'deploying',
  CHAIN_STATUS_ACTIVE: (event, payload) => (event === 'status_changed' && payload.data === 'active'),
  CHAIN_STATUS_TERMINATED: (event, payload) => (event === 'status_changed' && payload.data === 'terminated'),
  CHAIN_STATUS_CHANGED: 'status_changed',
  CHAIN_DEPLOYED: 'deployed',
  CHAIN_READY: 'ready'
};
