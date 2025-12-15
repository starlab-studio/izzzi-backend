import { IClass, IClassCreate } from "../../domain/types";
import { CreateClassUseCase } from "../use-cases/CreateClass.use-case";

export class ClassFacade {
  constructor(private readonly createClassUseCase: CreateClassUseCase) {}

  async createClass(data: IClassCreate, userEmail: string): Promise<IClass> {
    try {
      return await this.createClassUseCase.execute({
        ...data,
        userEmail,
      });
    } catch (error) {
      throw error;
    }
  }
}
