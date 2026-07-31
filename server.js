require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const prisma = require("./src/config/db");
const { socketAuth } = require("./src/middlewares/socketAuth.middleware");
const { registerUser, removeUser } = require("./src/config/socketRegistry");

const PORT = process.env.PORT || 5005;

// Create a raw HTTP server wrapping your Express app
const server = http.createServer(app);

// Attach Socket.IO to that SAME server
const io = new Server(server, {
  cors: { origin: "*" },
});

// Make `io` accessible from anywhere else in your app (controllers, services)
app.set("io", io);

// Run authentication BEFORE any connection is accepted
io.use(socketAuth);

io.on("connection", (socket) => {
  console.log(`[Socket.IO] Authenticated connection: ${socket.id}, user: ${socket.user.email}`);

  registerUser(socket.user.id, socket);

  socket.on("disconnect", () => {
    console.log(`[Socket.IO] Disconnected: ${socket.id}`);
    removeUser(socket.user.id);
  });
});

async function startServer() {
  try {
    await prisma.$connect();
    console.log("Database connected");

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Server startup failed:", err);
    process.exit(1);
  }
}

startServer();