import { IRepository } from "src/core";
import { ICreateNotification, INotification } from "../notification.types";

export interface INotificationRespository {
  create(entity: ICreateNotification): Promise<INotification>;
  update(id: string, entity: Partial<INotification>): Promise<INotification>;
  findById(id: string): Promise<INotification | null>;
}
