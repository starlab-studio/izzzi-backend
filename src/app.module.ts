import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { CoreModule } from "./core/core.module";
import { AuthModule } from "./modules/auth";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

import AppConfig from "./core/interfaces/config.global";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [AppConfig],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const db = configService.get("database");
        return {
          type: "postgres",
          host: db.host,
          port: db.port,
          database: db.dbname,
          username: db.username,
          password: db.password,
          synchronize: db.synchronize,
          autoLoadEntities: true,
        };
      },
    }),
    CoreModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
