import { Injectable, Inject } from "@nestjs/common";
import type { IContactRequestRepository } from "../../domain/repositories/contact-request.repository";
import { CreateEmailNotificationUseCase } from "src/modules/notification/application/use-cases/create-email-notification.use-case";
import { GeneralUtils } from "src/utils/general.utils";

export interface SendContactReplyEmailInput {
  contactRequestId: string;
  subject: string;
  message: string;
}

export interface SendContactReplyEmailOutput {
  success: boolean;
}

@Injectable()
export class SendContactReplyEmailUseCase {
  constructor(
    @Inject("IContactRequestRepository")
    private readonly contactRequestRepository: IContactRequestRepository,
    private readonly createEmailNotificationUseCase: CreateEmailNotificationUseCase,
  ) {}

  async execute(
    input: SendContactReplyEmailInput,
  ): Promise<SendContactReplyEmailOutput> {
    const contactRequest = await this.contactRequestRepository.findById(
      input.contactRequestId,
    );

    if (!contactRequest) {
      throw new Error("Contact request not found");
    }

    const template = GeneralUtils.htmlTemplateReader("contact-reply.html", {
      firstName: contactRequest.firstName,
      message: input.message,
    });

    await this.createEmailNotificationUseCase.execute({
      subject: input.subject,
      template,
      target: contactRequest.email,
    });

    return { success: true };
  }
}
