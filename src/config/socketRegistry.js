// A simple in-memory map: userId -> socket
const connectedUsers = new Map();

const registerUser = (userId, socket) => {
  connectedUsers.set(userId, socket);
};

const removeUser = (userId) => {
  connectedUsers.delete(userId);
};

const getUserSocket = (userId) => {
  return connectedUsers.get(userId);
};

module.exports = { registerUser, removeUser, getUserSocket };