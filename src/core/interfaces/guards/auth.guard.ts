import { Request } from "express";
import { JwtService } from "@nestjs/jwt";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException("No token provided");
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get("auth.jwt.secret"),
      });

      request["user"] = payload;

      return true;
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  private extractToken(request: Request): string | undefined {
    const tokenFromHeader = this.extractTokenFromHeader(request);
    if (tokenFromHeader) {
      return tokenFromHeader;
    }

    const tokenFromCookie = this.extractTokenFromCookie(request);
    if (tokenFromCookie) {
      return tokenFromCookie;
    }

    return undefined;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    return request.cookies?.["access_token"];
  }
}
