import * as SibApiV3Sdk from "@sendinblue/client";

import { ApplicationError, ErrorCode } from "src/core";
import { INotification } from "../../domain/notification.types";
import { INotificationProvider } from "../../application/providers/notification.provider";
import { ConfigService } from "@nestjs/config";

export class EmailProvider implements INotificationProvider {
  private static instance: EmailProvider;
  private readonly client: SibApiV3Sdk.TransactionalEmailsApi;

  constructor(private readonly configService: ConfigService) {
    this.client = new SibApiV3Sdk.TransactionalEmailsApi();
    const apiKey = this.configService.get<string>(
      "nofitication.email_provider.key",
    );
    if (!apiKey)
      throw new ApplicationError(
        ErrorCode.INVALID_BREVO_API_KEY,
        "Brevo API KEY not found!",
      );
    this.client.setApiKey(
      SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
      apiKey,
    );
  }

  public static getInstance(configService: ConfigService): EmailProvider {
    if (!EmailProvider.instance) {
      EmailProvider.instance = new EmailProvider(configService);
    }
    return EmailProvider.instance;
  }

  async send(data: INotification): Promise<void> {
    try {
      const emailData = {
        sender: { email: data.sender, name: data.name },
        to: [{ email: data.target }],
        subject: data.subject,
        htmlContent: data.template,
      };
      await this.client.sendTransacEmail(emailData);
    } catch (error) {
      console.log("Something went wrong when sending notification : ", error);
      throw error;
    }
  }
}
