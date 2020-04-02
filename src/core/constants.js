export const Event = {
  PHX_REPLY: 'phx_reply',
  ERROR: 'phx_error',
  CHAIN_ERROR: 'error',
  CHAIN_FAILURE: 'failed',
  API_JOIN: 'phx_reply',
  CHAIN_JOIN: 'phx_reply',
  CHAIN_CREATED: 'phx_reply',
  CHAIN_STARTED: 'started',
  CHAIN_DEPLOYING: 'deploying',
  CHAIN_STATUS_CHANGED: 'status_changed',
  CHAIN_DEPLOYED: 'deployed',
  CHAIN_DEPLOYMENT_FAILED: 'deployment_failed',
  CHAIN_READY: 'ready',
  CHAIN_TERMINATED: 'terminated',
  CHAIN_DELETED: 'phx_reply',

  OK: 'ok',
  READY: 'ready',

  SNAPSHOT_TAKEN: 'snapshot_taken',
  SNAPSHOT_REVERTED: 'snapshot_reverted',

  STACK_READY: 'stack:ready',
  STACK_FAILED: 'stack:failed'
};

/**
 * List of EVM statuses
 */
export const Status = {
  INITIALIZING: 'initializing',
  ACTIVE: 'active',

  DEPLOYING: 'deploying',
  DEPLOYMENT_FAILED: 'deployment_failed',
  DEPLOYMENT_SUCCESS: 'deployment_success',
  TERMINATING: 'terminating',
  TERMINATED: 'terminated',
  FAILED: 'failed',

  TAKING_SNAPSHOT: 'snapshot_taking',
  SNAPSHOT_TAKEN: 'snapshot_taken',
  REVERTING_SNAPSHOT: 'snapshot_reverting',
  SNAPSHOT_REVERTED: 'snapshot_reverted',

  READY: 'ready'
};

export const Action = {
  START_CHAIN: 'start',
  STOP_CHAIN: 'stop',
  RESTART_CHAIN: 'start_existing',
  DELETE_CHAIN: 'remove_chain',
  TAKE_SNAPSHOT: 'take_snapshot',
  RESTORE_SNAPSHOT: 'revert_snapshot'
};

export const ChannelName = {
  API: 'api'
};
