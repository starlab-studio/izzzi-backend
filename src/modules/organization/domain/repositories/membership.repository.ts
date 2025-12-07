import { IRepository } from "src/core";
import { MembershipEntity } from "../entities/membership.entity";

export interface IMembershipRepository extends IRepository<MembershipEntity> {
  create(data: MembershipEntity): Promise<MembershipEntity>;
  findByUser(userId: string): Promise<MembershipEntity[] | []>;
  findByOrganization(organizationId: string): Promise<MembershipEntity[] | []>;
  findByUserAndOrganization(
    userId: string,
    organizationId: string
  ): Promise<MembershipEntity | null>;
}
