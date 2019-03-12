export const Event = {
  OK: 'phx_reply',
  ERROR: 'phx_error',
  CHAIN_ERROR: 'error',
  CHAIN_FAILURE: 'failed',
  API_JOIN: 'phx_reply',
  CHAIN_JOIN: 'phx_reply',
  CHAIN_CREATED: 'phx_reply',
  CHAIN_STARTED: 'started',
  CHAIN_DEPLOYING: 'deploying',
  CHAIN_STATUS_CHANGED: 'status_changed',
  CHAIN_STATUS_ACTIVE: 'status_changed_active',
  CHAIN_STATUS_TERMINATING: 'status_changed_terminating',
  CHAIN_STATUS_TAKING_SNAP: 'status_changed_snapshot_taking',
  CHAIN_STATUS_SNAP_TAKEN: 'status_changed_snapshot_taken',
  CHAIN_STATUS_REVERTING_SNAP: 'status_changed_snapshot_reverting',
  CHAIN_STATUS_SNAP_REVERTED: 'status_changed_snapshot_reverted',
  CHAIN_DEPLOYED: 'deployed',
  CHAIN_DEPLOYMENT_FAILED: 'deployment_failed',
  CHAIN_READY: 'ready',
  CHAIN_TERMINATED: 'terminated',
  CHAIN_DELETED: 'phx_reply',
  SNAPSHOT_TAKEN: 'snapshot_taken',
  SNAPSHOT_REVERTED: 'snapshot_reverted'
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
