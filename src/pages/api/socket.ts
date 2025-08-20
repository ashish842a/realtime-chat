import { Server } from "socket.io";
import type { NextApiRequest, NextApiResponse } from "next";

type User = {
  id: string;
  name: string;
};

let onlineUsers: User[] = [];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: "/api/socket",
      cors: { origin: "*" },
    });

    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("Client connected");

      // Handle new user join
      socket.on("join", (name: string) => {
        onlineUsers.push({ id: socket.id, name });
        io.emit("online-users", onlineUsers);
      });

      // Handle sending messages
      socket.on("send-message", (msg) => {
        io.emit("receive-message", msg);
        });

      // Handle typing
      socket.on("typing", (name: string) => {
        socket.broadcast.emit("typing", name);
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        onlineUsers = onlineUsers.filter((u) => u.id !== socket.id);
        io.emit("online-users", onlineUsers);
        console.log("Client disconnected");
      });
    });
  }
  res.end();
}
