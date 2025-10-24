import { IMembership, IMembershipCreate, Role } from "../types";

export class MembershipEntity implements IMembership {
  public readonly id: string;
  public userId: string;
  public organizationId: string;
  public role: Role;
  addedBy: string | null;
  public readonly createdAt?: Date | undefined;
  public readonly updatedAt?: Date | undefined;

  constructor(data: IMembershipCreate) {
    this.userId = data.userId;
    this.organizationId = data.organizationId;
    this.role = data.role;
    this.addedBy = data.addedBy;
  }
}
