const { getUserSocket } = require("../config/socketRegistry");

const notifyUser = (userId, event, data) => {
  const socket = getUserSocket(userId);

  if (socket) {
    socket.emit(event, data);
    console.log(`[Notify] Sent "${event}" to user ${userId}`);
  } else {
    console.log(`[Notify] User ${userId} is not connected — notification skipped`);
  }
};

module.exports = { notifyUser };