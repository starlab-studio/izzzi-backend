import { IoAdapter } from "@nestjs/platform-socket.io";
import { ServerOptions } from "socket.io";
import { INestApplicationContext } from "@nestjs/common";

export class SocketIoAdapter extends IoAdapter {
  constructor(appOrHttpServer?: INestApplicationContext | object) {
    super(appOrHttpServer);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const corsConfig = {
      origin: ["http://localhost:3001", "http://www.localhost:3001"],
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    };

    const serverOptions = {
      cors: corsConfig,
      transports: ["websocket", "polling"],
      allowEIO3: true,
      path: options?.path || "/socket.io",
      serveClient: options?.serveClient ?? false,
      ...options,
    } as ServerOptions;

    serverOptions.cors = corsConfig;
    serverOptions.transports = ["websocket", "polling"];

    return super.createIOServer(port, serverOptions);
  }
}
