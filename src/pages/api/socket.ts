import { NextApiRequest, NextApiResponse } from "next";
import { Server } from "socket.io";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!res.socket?.server) {
    res.status(500).end("Socket not initialized");
    return;
  }

  // Initialize Socket.io only once
  if (!(res.socket.server as any).io) {
    const io = new Server(res.socket.server, {
      path: "/api/socket",
      cors: { origin: "*" },
    });
    (res.socket.server as any).io = io;

    io.on("connection", (socket) => {
      console.log("New client connected:", socket.id);

      // Track online users
      socket.on("join", (name: string) => {
        socket.data.name = name;
        const users = Array.from(io.sockets.sockets.values()).map(s => ({
          id: s.id,
          name: s.data.name,
        }));
        io.emit("online-users", users);
      });

      // Broadcast message
      socket.on("send-message", (msg) => {
        io.emit("receive-message", msg);
      });

      // Typing indicator
      socket.on("typing", (name: string) => {
        socket.broadcast.emit("typing", name);
      });

      socket.on("disconnect", () => {
        const users = Array.from(io.sockets.sockets.values()).map(s => ({
          id: s.id,
          name: s.data.name,
        }));
        io.emit("online-users", users);
      });
    });
  }

  res.end();
}
