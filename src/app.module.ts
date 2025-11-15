import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { CoreModule } from "./core/core.module";
import { AuthModule } from "./modules/auth";
import { OrganizationModule } from "./modules/organization";
import { NotificationModule } from "./modules/notification";

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
    OrganizationModule,
    NotificationModule,
  ],
})
export class AppModule {}
