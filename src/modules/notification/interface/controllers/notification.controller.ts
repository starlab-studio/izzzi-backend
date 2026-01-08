import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import {
  BaseController,
  AuthGuard,
  CurrentUser,
  type JWTPayload,
} from "src/core";
import { GetNotificationsUseCase } from "../../application/use-cases/get-notifications.use-case";
import { MarkNotificationReadUseCase } from "../../application/use-cases/mark-notification-read.use-case";
import { MarkAllNotificationsReadUseCase } from "../../application/use-cases/mark-all-notifications-read.use-case";

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags("Notifications")
@Controller("v1/notifications")
export class NotificationController extends BaseController {
  constructor(
    private readonly getNotificationsUseCase: GetNotificationsUseCase,
    private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
    private readonly markAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase,
  ) {
    super();
  }

  @Get()
  @ApiOperation({
    summary: "Get user notifications",
    description: "Retrieves all push notifications for the authenticated user",
  })
  @ApiResponse({
    status: 200,
    description: "Notifications retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Authentication required" })
  async getNotifications(@CurrentUser() user: JWTPayload) {
    const result = await this.getNotificationsUseCase.execute({
      userId: user.userId,
    });

    return this.success(result);
  }

  @Patch(":id/mark-read")
  @ApiOperation({
    summary: "Mark notification as read/unread",
    description: "Marks a specific notification as read or unread",
  })
  @ApiParam({
    name: "id",
    description: "Notification ID",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Notification updated successfully",
  })
  @ApiResponse({ status: 401, description: "Authentication required" })
  @ApiResponse({ status: 404, description: "Notification not found" })
  async markAsRead(
    @Param("id") notificationId: string,
    @Body() body: { read: boolean },
    @CurrentUser() user: JWTPayload,
  ) {
    const result = await this.markNotificationReadUseCase.execute({
      notificationId,
      userId: user.userId,
      isRead: body.read,
    });

    return this.success(result);
  }

  @Post("mark-all-read")
  @ApiOperation({
    summary: "Mark all notifications as read",
    description:
      "Marks all push notifications as read for the authenticated user",
  })
  @ApiResponse({
    status: 200,
    description: "All notifications marked as read",
  })
  @ApiResponse({ status: 401, description: "Authentication required" })
  async markAllAsRead(@CurrentUser() user: JWTPayload) {
    const result = await this.markAllNotificationsReadUseCase.execute({
      userId: user.userId,
    });

    return this.success(result);
  }
}
