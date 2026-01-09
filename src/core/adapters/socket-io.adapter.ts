import { IoAdapter } from "@nestjs/platform-socket.io";
import { ServerOptions } from "socket.io";
import { INestApplicationContext } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export class SocketIoAdapter extends IoAdapter {
  private configService: ConfigService | null = null;

  constructor(appOrHttpServer?: INestApplicationContext | object) {
    super(appOrHttpServer);
    if (
      appOrHttpServer &&
      typeof appOrHttpServer === "object" &&
      "get" in appOrHttpServer
    ) {
      try {
        this.configService = (appOrHttpServer as INestApplicationContext).get(
          ConfigService,
          { strict: false }
        );
      } catch {
        // ConfigService not available, will use fallback
      }
    }
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const frontendUrl =
      this.configService?.get<string>("frontend.url") ||
      process.env.FRONTEND_DOMAIN_URL ||
      "http://localhost:3000";
    const corsOrigins = [
      frontendUrl,
      frontendUrl.replace(/^https?:\/\//, "https://www."),
      "http://localhost:3000",
      "http://localhost:3001",
      "http://www.localhost:3001",
    ].filter((origin, index, self) => self.indexOf(origin) === index);

    const corsConfig = {
      origin: corsOrigins,
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
