import { IClass, IClassCreate } from "../../domain/types";
import { ClassService } from "../services/class.service";

export class ClassFacade {
  constructor(private readonly classService: ClassService) {}

  async createClass(data: IClassCreate, userEmail: string): Promise<IClass> {
    try {
      return await this.classService.createClass(data, userEmail);
    } catch (error) {
      throw error;
    }
  }
}
