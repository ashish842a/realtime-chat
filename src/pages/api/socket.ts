import { NextApiRequest } from "next";
import { NextApiResponse } from "next";
import { Server as IOServer } from "socket.io";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(res.socket as any).server.io) {
    console.log("🚀 Initializing Socket.IO server...");

    const io = new IOServer((res.socket as any).server, {
      path: "/api/socket",
      cors: { origin: "*" },
    });

    (res.socket as any).server.io = io;

    io.on("connection", (socket) => {
      console.log("✅ New client connected:", socket.id);

      // Handle user joining
      socket.on("join", (name: string) => {
        socket.data.name = name;
        const users = Array.from(io.sockets.sockets.values()).map((s) => ({
          id: s.id,
          name: s.data.name,
        }));
        io.emit("online-users", users);
      });

      // Handle sending messages
      socket.on("send-message", (msg) => {
        io.emit("receive-message", msg);
      });

      // Handle typing indicator
      socket.on("typing", (name: string) => {
        socket.broadcast.emit("typing", name);
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        const users = Array.from(io.sockets.sockets.values()).map((s) => ({
          id: s.id,
          name: s.data.name,
        }));
        io.emit("online-users", users);
      });
    });
  } else {
    console.log("⚡ Socket.IO server already running.");
  }

  res.end();
}
