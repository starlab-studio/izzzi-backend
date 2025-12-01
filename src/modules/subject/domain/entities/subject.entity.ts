import { ISubject, ISubjectCreate } from "../types";

export class Subject implements ISubject {
  public readonly id: string;
  public name: string;
  public description?: string;
  public color: string;
  public isActive: boolean;
  public organizationId: string;
  public userId: string;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor(data: ISubjectCreate) {
    this.name = data.name;
    this.description = data.description;
    this.color = data.color;
    this.organizationId = data.organizationId;
    this.userId = data.userId;
    this.isActive = true;
  }
}
