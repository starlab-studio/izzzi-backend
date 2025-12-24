import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CoreModule } from "src/core/core.module";
import { StripeSyncService } from "./infrastructure/services/stripe-sync.service";

@Module({
  imports: [ConfigModule, CoreModule],
  providers: [
    {
      provide: StripeSyncService,
      useFactory: (configService: ConfigService) => {
        return new StripeSyncService(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [StripeSyncService],
})
export class PaymentModule {}
