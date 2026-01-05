import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ContactRequestModel } from "./infrastructure/models/contact-request.model";
import { ContactRequestRepositoryImpl } from "./infrastructure/repositories/contact-request.repository.impl";

import { CreateContactRequestUseCase } from "./application/use-cases/CreateContactRequest.use-case";
import { GetContactRequestsUseCase } from "./application/use-cases/GetContactRequests.use-case";
import { UpdateContactRequestUseCase } from "./application/use-cases/UpdateContactRequest.use-case";
import { DeleteContactRequestUseCase } from "./application/use-cases/DeleteContactRequest.use-case";
import { SendContactReplyEmailUseCase } from "./application/use-cases/SendContactReplyEmail.use-case";

import { ContactFacade } from "./application/facades/contact.facade";
import { ContactController } from "./interface/controllers/contact.controller";
import { SuperAdminGuard } from "./guards/super-admin.guard";
import { OrganizationModule } from "../organization/organization.module";
import { NotificationModule } from "../notification/notification.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ContactRequestModel]),
    forwardRef(() => OrganizationModule),
    forwardRef(() => NotificationModule),
  ],
  controllers: [ContactController],
  providers: [
    {
      provide: "IContactRequestRepository",
      useClass: ContactRequestRepositoryImpl,
    },
    CreateContactRequestUseCase,
    GetContactRequestsUseCase,
    UpdateContactRequestUseCase,
    DeleteContactRequestUseCase,
    SendContactReplyEmailUseCase,
    ContactFacade,
    SuperAdminGuard,
  ],
  exports: [ContactFacade, SuperAdminGuard, "IContactRequestRepository"],
})
export class ContactModule {}

