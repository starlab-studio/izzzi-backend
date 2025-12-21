import { Repository, In } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import {
  type IUnitOfWork,
  BaseTransactionalRepository,
} from "src/core";
import { QuizTemplateModel } from "../models/quiz-template.model";
import { QuizTemplateQuestionModel } from "../models/quiz-template-question.model";
import { IQuizTemplateRepository } from "../../domain/repositories/quiz-template.repository";
import { QuizTemplateEntity } from "../../domain/entities/quiz-template.entity";

export class QuizTemplateRepository
  extends BaseTransactionalRepository<QuizTemplateEntity>
  implements IQuizTemplateRepository
{
  constructor(
    @InjectRepository(QuizTemplateModel)
    private readonly directRepository: Repository<QuizTemplateModel>,
    @InjectRepository(QuizTemplateQuestionModel)
    private readonly questionRepository: Repository<QuizTemplateQuestionModel>,
    readonly unitOfWork: IUnitOfWork,
  ) {
    super(unitOfWork);
  }

  async findAll(): Promise<QuizTemplateEntity[]> {
    const ormEntityList = await this.directRepository.find();
    return ormEntityList.map((ormEntity) =>
      QuizTemplateEntity.reconstitute(ormEntity),
    );
  }

  async findById(id: string): Promise<QuizTemplateEntity | null> {
    const ormEntity = await this.directRepository.findOne({ where: { id } });
    if (!ormEntity) return null;

    const entity = QuizTemplateEntity.reconstitute(ormEntity);
    
    const questions = await this.questionRepository.find({
      where: { templateId: id },
      order: { orderIndex: "ASC" },
    });
    entity.setQuestions(questions);

    return entity;
  }

  async findByIds(ids: string[]): Promise<QuizTemplateEntity[]> {
    if (ids.length === 0) return [];
    
    const ormEntityList = await this.directRepository.find({
      where: { id: In(ids) },
    });
    
    const entities = ormEntityList.map((ormEntity) =>
      QuizTemplateEntity.reconstitute(ormEntity),
    );

    const questions = await this.questionRepository.find({
      where: { templateId: In(ids) },
      order: { templateId: "ASC", orderIndex: "ASC" },
    });

    const questionsByTemplate = new Map<string, typeof questions>();
    questions.forEach((q) => {
      if (!questionsByTemplate.has(q.templateId)) {
        questionsByTemplate.set(q.templateId, []);
      }
      questionsByTemplate.get(q.templateId)!.push(q);
    });

    entities.forEach((entity) => {
      const templateQuestions = questionsByTemplate.get(entity.id) || [];
      entity.setQuestions(templateQuestions);
    });

    return entities;
  }

  async create(entity: QuizTemplateEntity): Promise<QuizTemplateEntity> {
    const data = entity.toPersistence();
    const ormEntity = this.directRepository.create(data);
    const saved = await this.directRepository.save(ormEntity);
    const createdEntity = QuizTemplateEntity.reconstitute(saved);
    
    const questions = entity.questionsList;
    if (questions.length > 0) {
      const questionModels = questions.map((q) =>
        this.questionRepository.create({
          id: q.id,
          templateId: saved.id,
          text: q.text,
          type: q.type,
          options: q.options,
          validationRules: q.validationRules,
          orderIndex: q.orderIndex,
          category: q.category,
          createdAt: q.createdAt,
        }),
      );
      await this.questionRepository.save(questionModels);
      createdEntity.setQuestions(questions);
    }
    
    return createdEntity;
  }

  async save(entity: QuizTemplateEntity): Promise<QuizTemplateEntity> {
    const data = entity.toPersistence();
    const saved = await this.directRepository.save(data);
    return QuizTemplateEntity.reconstitute(saved);
  }

  async delete(id: string): Promise<void> {
    await this.directRepository.delete(id);
  }
}

