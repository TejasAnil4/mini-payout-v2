const jwt = require("jsonwebtoken");

const socketAuth = (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("No token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;   // attach decoded user info to the socket, just like req.user
    next();
  } catch (err) {
    next(new Error("Invalid or expired token"));
  }
};

module.exports = { socketAuth };