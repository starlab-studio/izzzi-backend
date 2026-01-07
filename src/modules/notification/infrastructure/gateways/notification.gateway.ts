import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Logger, Inject } from "@nestjs/common";
import { INotificationGateway } from "../../application/gateways/notification-gateway.interface";
import { INotification } from "../../domain/notification.types";
import { JWTPayload } from "src/core";
import { type ISubjectRepository } from "src/modules/subject/domain/repositories/subject.repository";
import { NotificationOutput } from "../../application/use-cases/get-notifications.use-case";

@WebSocketGateway({
  cors: {
    origin: ["http://localhost:3001", "http://www.localhost:3001"],
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
})
export class NotificationGateway
  implements INotificationGateway, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject("SUBJECT_REPOSITORY")
    private readonly subjectRepository: ISubjectRepository
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<JWTPayload>(token, {
        secret: this.configService.get("auth.jwt.secret"),
      });

      const userId = payload.userId;
      if (!userId) {
        this.logger.warn(`Connection rejected: No userId in token`);
        client.disconnect();
        return;
      }

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      client.join(`user:${userId}`);

      this.logger.log(`User ${userId} connected (socket: ${client.id})`);
    } catch (error) {
      this.logger.warn(`Connection rejected: Invalid token`, error);
      client.disconnect();
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    for (const [userId, socketIds] of this.userSockets.entries()) {
      if (socketIds.has(client.id)) {
        socketIds.delete(client.id);
        if (socketIds.size === 0) {
          this.userSockets.delete(userId);
        }
        this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);
        break;
      }
    }
  }

  async emitToUser(userId: string, notification: INotification): Promise<void> {
    const socketIds = this.userSockets.get(userId);
    if (!socketIds || socketIds.size === 0) {
      this.logger.debug(
        `User ${userId} is not connected, notification will be retrieved on next fetch`
      );
      return;
    }

    const transformedNotification =
      await this.transformNotification(notification);
    if (!transformedNotification) {
      this.logger.warn(
        `Failed to transform notification ${notification.id}, skipping emission`
      );
      return;
    }

    this.server
      .to(`user:${userId}`)
      .emit("notification:new", transformedNotification);
    this.logger.log(`Notification sent to user ${userId}`);
  }

  private async transformNotification(
    notification: INotification
  ): Promise<NotificationOutput | null> {
    try {
      const metadata = notification.metadata || {};
      const subjectId = metadata.subjectId as string | undefined;
      const alertType = metadata.alertType as "negative" | "alert" | undefined;

      if (!subjectId) {
        this.logger.warn(
          `Notification ${notification.id} missing subjectId metadata`
        );
        return null;
      }

      const subject = await this.subjectRepository.findById(subjectId);
      if (!subject) {
        this.logger.warn(
          `Subject ${subjectId} not found for notification ${notification.id}`
        );
        return null;
      }

      const type: "negative" | "positive" =
        alertType === "negative" || alertType === "alert"
          ? "negative"
          : "positive";

      return {
        id: notification.id,
        type,
        courseName: subject.name,
        teacherName: subject.instructorName || "N/A",
        timestamp: notification.createdAt.toISOString(),
        isRead: notification.isRead,
      };
    } catch (error) {
      this.logger.error(
        `Error transforming notification ${notification.id}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return null;
    }
  }

  private extractToken(client: Socket): string | undefined {
    const tokenFromQuery = client.handshake.query.token as string | undefined;
    if (tokenFromQuery) {
      return tokenFromQuery;
    }

    const authHeader = client.handshake.headers.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(" ");
      if (type === "Bearer") {
        return token;
      }
    }

    return undefined;
  }
}
