const { AppError } = require("../utils/errors");

const errorHandler = (err, req, res, next) => {
  console.error("ERROR:", err);

  // Our custom, expected errors — trust the statusCode and message
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Prisma's "unique constraint violated" error
  if (err.code === "P2002") {
    const field = err.meta?.target?.[0] || "field";
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists`,
    });
  }

  // Prisma's "record not found" error (e.g. update/delete on missing row)
  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Record not found",
    });
  }

  // Anything else — unexpected bug, don't leak internals to the client
  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

module.exports = { errorHandler };