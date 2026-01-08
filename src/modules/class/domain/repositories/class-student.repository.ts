import { IRepository } from "src/core";
import { ClassStudentEntity } from "../entities/class-student.entity";

export interface IClassStudentRepository
  extends IRepository<ClassStudentEntity> {
  create(data: ClassStudentEntity): Promise<ClassStudentEntity>;
  findByClass(classId: string): Promise<ClassStudentEntity[]>;
  findByClassAndActive(
    classId: string,
    isActive: boolean,
  ): Promise<ClassStudentEntity[]>;
  findByEmailAndClass(
    email: string,
    classId: string,
  ): Promise<ClassStudentEntity | null>;
  deleteByClass(classId: string): Promise<void>;
}
