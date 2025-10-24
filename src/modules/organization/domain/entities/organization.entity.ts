import { IOrganization, IUser } from "../types";

export class OrganizationEntity implements IOrganization {
  public readonly id: string;
  public name: string;
  public siren: string | undefined;
  public siret: string | undefined;
  public vatNumber: string | undefined;
  public slug: string;
  public ownerId: string;
  public createdAt?: Date | undefined;
  public updatedAt?: Date | undefined;

  constructor(data: IOrganization) {
    this.name = data.name;
    this.siren = data.siren;
    this.siret = data.siret;
    this.vatNumber = data.vatNumber;
    this.slug = data.slug;
    this.ownerId = data.ownerId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
