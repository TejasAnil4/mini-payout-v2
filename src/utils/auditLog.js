const prisma = require("../config/db");

const logAction = async ({ userId, action, entityType, entityId, metadata }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId: entityId || null,
        metadata: metadata || undefined,
      },
    });
  } catch (err) {
    console.error("[AuditLog] Failed to write log:", err.message);
  }
};

module.exports = { logAction };