import { NestFactory } from "@nestjs/core";
import { ConsoleLogger, ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import {
  HttpExceptionFilter,
  RequestLoggingInterceptor,
  LoggerService,
} from "./core";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      json: true,
    }),
  });

  // Custom Exception filter for error handling
  app.useGlobalFilters(new HttpExceptionFilter(app.get(LoggerService)));

  // Custom Request logging interceptor
  app.useGlobalInterceptors(
    new RequestLoggingInterceptor(app.get(LoggerService))
  );

  // Validation pipes for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Swagger Setup
  const config = new DocumentBuilder()
    .setTitle("IZZZI API Documentation")
    .setDescription("Documentation for IZZZI main backend API")
    .setVersion("1.0")
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
