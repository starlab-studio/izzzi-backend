import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const RefreshToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const refreshToken = request.refreshToken;

    if (!refreshToken) {
      throw new Error(
        "RefreshToken not found. Make sure RefreshTokenGuard is applied."
      );
    }

    return refreshToken;
  }
);
