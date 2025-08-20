"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type Message = {
  user: string;
  text?: string;       // text messages
  fileName?: string;   // file name
  fileType?: string;   // MIME type
  fileData?: string;   // base64 content
  time: string;        // timestamp
};

type User = {
  id: string;
  name: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [entered, setEntered] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/socket");

    const socket = io("http://localhost:3000", { path: "/api/socket" });
    socketRef.current = socket;

    socket.on("receive-message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    });

    socket.on("typing", (user: string) => {
      if (user !== name) {
        setTypingUser(user);
        setTimeout(() => setTypingUser(null), 1500);
      }
    });

    socket.on("online-users", (users: User[]) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.disconnect();
    };
  }, [name]);

  // Close full-screen modal on Esc
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreenImage(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleJoin = () => {
    if (!name.trim() || !socketRef.current) return;
    setEntered(true);
    socketRef.current.emit("join", name.trim());
  };

  const handleSend = () => {
    if (!input.trim() || !socketRef.current) return;

    const msg: Message = {
      user: name,
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    socketRef.current.emit("send-message", msg);
    setInput("");
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (socketRef.current) {
      socketRef.current.emit("typing", name);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      entered ? handleSend() : handleJoin();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socketRef.current) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      const msg: Message = {
        user: name,
        fileName: file.name,
        fileType: file.type,
        fileData: base64Data,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      socketRef.current?.emit("send-message", msg);
    };
    reader.readAsDataURL(file);
  };

  if (!entered) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Enter Your Name</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <Button onClick={handleJoin}>Join Chat</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 relative">
      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setFullscreenImage(null)}
        >
          <img
            src={fullscreenImage}
            alt="Full Screen"
            className="max-h-[90%] max-w-[90%] rounded shadow-lg"
          />
        </div>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Realtime Chat</CardTitle>
          <div className="text-sm text-gray-500 mt-1 flex gap-2 flex-wrap">
            {onlineUsers.map((u) => (
              <span key={u.id} className={`px-2 py-1 rounded ${u.name === name ? 'bg-blue-200 font-bold' : 'bg-gray-200'}`}>
                {u.name}
              </span>
            ))}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col h-[500px]">
          <ScrollArea className="flex-1 mb-4 p-2 space-y-2 bg-gray-50 rounded" ref={scrollRef}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.user === name ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`p-3 rounded-lg max-w-[75%] break-words ${msg.user === name
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                    }`}
                >
                  <span className="font-semibold text-sm">{msg.user}: </span>
                  {msg.text && <div>{msg.text}</div>}
                  {msg.fileData && msg.fileType?.startsWith("image/") ? (
                    <img
                      src={msg.fileData}
                      alt={msg.fileName}
                      className="max-w-full rounded cursor-pointer hover:opacity-80"
                      onClick={() => msg.fileData && setFullscreenImage(msg.fileData)}
                    />
                  ) : (
                    <a
                      href={msg.fileData}
                      download={msg.fileName}
                      className="text-blue-600 underline"
                      target="_blank"
                    >
                      {msg.fileName}
                    </a>
                  )}

                  <div className="text-xs text-gray-400 mt-1 text-right">{msg.time}</div>
                </div>
              </div>
            ))}

            {typingUser && (
              <div className="text-sm text-gray-500 italic">{typingUser} is typing...</div>
            )}
          </ScrollArea>

          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Type a message..."
              value={input}
              onChange={handleTyping}
              onKeyDown={handleKeyPress}
            />
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="bg-gray-300 px-4 py-2 rounded cursor-pointer hover:bg-gray-400">
              📎
            </label>
            <Button onClick={handleSend}>Send</Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
