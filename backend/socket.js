import { Server } from "socket.io";

let io;
const userSockets = new Map(); // Store userId -> socketId mapping

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL,
        "https://packagingbazaar.co.in",
        "http://localhost:5173",
        "http://localhost:5000",
        "http://localhost:3000"
      ].filter(Boolean),
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    
    if (userId && userId !== "undefined") {
      userSockets.set(userId.toString(), socket.id);
      console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
    }

    socket.on("disconnect", () => {
      if (userId) {
        userSockets.delete(userId.toString());
        console.log(`User disconnected: ${userId}`);
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export const getReceiverSocketId = (userId) => {
  return userSockets.get(userId.toString());
};
