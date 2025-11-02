import { IOrganization, IOrganizationCreate } from "../types";

export class OrganizationEntity implements IOrganization {
  public readonly id: string;
  public name: string;
  public siren?: string;
  public siret?: string;
  public vatNumber?: string;
  public slug: string;
  public ownerId: string;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor(data: IOrganizationCreate) {
    this.name = data.name;
    this.slug = data.slug;
    this.ownerId = data.ownerId;
  }
}
