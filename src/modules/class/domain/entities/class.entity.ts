import { IClass, IClassCreate } from "../types";
import * as crypto from "crypto";

export class Class implements IClass {
  public readonly id: string;
  public name: string;
  public code: string;
  public description?: string;
  public accessToken: string;
  public isActive: boolean;
  public organizationId: string;
  public userId: string;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor(data: IClassCreate) {
    this.name = data.name;
    this.description = data.description;
    this.organizationId = data.organizationId;
    this.userId = data.userId;
    this.isActive = true;
    this.code = this.generateCode(data.name);
    this.accessToken = this.generateAccessToken();
  }

  private generateCode(name: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString("hex");
    const sanitizedName = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 10);
    return `${sanitizedName}-${timestamp}-${random}`;
  }

  private generateAccessToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }
}

