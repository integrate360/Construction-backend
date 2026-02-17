// Audit logging utility for tracking critical actions
const logAction = (userId, action, resource, resourceId, details = {}) => {
  const log = {
    timestamp:  new Date().toISOString(),
    userId,
    action,    // CREATE | UPDATE | DELETE | LOGIN | ACCESS
    resource,  // Project | Client | BOQ | Labour | Material | etc.
    resourceId,
    details,
  };
  // In production: store in DB or log service
  console.log('[AUDIT]', JSON.stringify(log));
  return log;
};

module.exports = { logAction };
