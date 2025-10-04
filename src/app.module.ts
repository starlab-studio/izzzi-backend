import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

import configGlobal from "./core/infrastructure/config.global";

const config = configGlobal();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: config.database.host,
      port: config.database.port,
      database: config.database.dbname,
      username: config.database.username,
      password: config.database.password,
      synchronize: config.database.synchronize,
      entities: [],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
