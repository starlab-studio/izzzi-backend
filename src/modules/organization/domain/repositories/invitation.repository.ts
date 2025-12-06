import { IRepository } from "src/core";
import { InvitationEntity } from "../entities/invitation.entity";

export interface IInvitationRepository extends IRepository<InvitationEntity> {
  create(data: InvitationEntity): Promise<InvitationEntity>;
  findByEmail(email: string): Promise<InvitationEntity[]>;
  findByOrganization(organizationId: string): Promise<InvitationEntity[] | []>;
  findByInviter(inviterId: string): Promise<InvitationEntity[] | []>;
  findByInviterAndOrganization(
    inviterId: string,
    organizationId: string
  ): Promise<InvitationEntity[] | []>;
  findPendingByEmailAndOrg(
    email: string,
    organizationId: string
  ): Promise<InvitationEntity | null>;
}
