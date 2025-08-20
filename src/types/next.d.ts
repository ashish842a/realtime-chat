import type { Socket } from "net";
import type { Server as HTTPServer } from "http";
import type { Server as IOServer } from "socket.io";

declare module "next" {
  import type { NextApiResponse } from "next";

  export interface NextApiResponseWithSocket extends NextApiResponse {
    socket: Socket & {
      server: HTTPServer & {
        io?: IOServer;
      };
    };
  }
}
