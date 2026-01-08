import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { CoreModule } from "./core/core.module";
import { AuthModule } from "./modules/auth";
import { OrganizationModule } from "./modules/organization";
import { NotificationModule } from "./modules/notification";
import { ClassModule } from "./modules/class";
import { SubjectModule } from "./modules/subject";
import { QuizModule } from "./modules/quiz/quiz.module";
import { SubscriptionModule } from "./modules/subscription/subscription.module";
import { UserModule } from "./modules/user/user.module";
import { FeedbackModule } from "./modules/feedback/feedback.module";
import { ReportModule } from "./modules/report/report.module";

import AppConfig from "./core/interfaces/config.global";
import { FaqModule } from "./modules/faq/faq.module";
import { StorageModule } from "./modules/storage/core.module";
import { ContactModule } from "./modules/contact/contact.module";
import { SuperAdminModule } from "./modules/super-admin/super-admin.module";

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
        const db = configService.get<{
          host: string;
          port: number;
          dbname: string;
          username: string;
          password: string;
          synchronize: boolean;
        }>("database");
        if (!db) {
          throw new Error("Database configuration is missing");
        }
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
    ClassModule,
    SubjectModule,
    QuizModule,
    SubscriptionModule,
    UserModule,
    FaqModule,
    FeedbackModule,
    ReportModule,
    StorageModule,
    ContactModule,
    SuperAdminModule,
  ],
})
export class AppModule {}
