import { IOrganization, IUser } from "../types";

export class OrganizationEntity implements IOrganization {
  public readonly id: string;
  public name: string;
  public siren: string | undefined;
  public siret: string | undefined;
  public vat_number: string | undefined;
  public slug: string;
  public owner: IUser | string;
  public createdAt?: Date | undefined;
  public updatedAt?: Date | undefined;

  constructor(data: IOrganization) {
    this.name = data.name;
    this.siren = data.siren;
    this.siret = data.siret;
    this.vat_number = data.vat_number;
    this.slug = data.slug;
    this.owner = data.owner;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
