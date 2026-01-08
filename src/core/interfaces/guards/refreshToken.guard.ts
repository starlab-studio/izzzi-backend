import { Request } from "express";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from "@nestjs/common";

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { refreshToken?: string }>();

    const refreshToken = this.extractRefreshToken(request);

    if (!refreshToken) {
      throw new BadRequestException("Refresh token is required");
    }

    request.refreshToken = refreshToken;

    return true;
  }

  private extractRefreshToken(request: Request): string | undefined {
    // Try to get from request body first (POST data)
    const tokenFromBody = this.extractTokenFromBody(request);
    if (tokenFromBody) {
      return tokenFromBody;
    }

    const tokenFromCookie = this.extractTokenFromCookie(request);
    if (tokenFromCookie) {
      return tokenFromCookie;
    }

    const tokenFromHeader = this.extractTokenFromHeader(request);
    if (tokenFromHeader) {
      return tokenFromHeader;
    }

    return undefined;
  }

  private extractTokenFromBody(request: Request): string | undefined {
    const body = request.body as
      | { refreshToken?: string; refresh_token?: string }
      | undefined;
    if (body && typeof body === "object") {
      return body.refreshToken || body.refresh_token;
    }
    return undefined;
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    const cookies = request.cookies as { refresh_token?: string } | undefined;
    return cookies?.["refresh_token"];
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const token = request.headers["x-refresh-token"] as string;
    return token || undefined;
  }
}
