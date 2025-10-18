export interface IUseCase<Input = any, Output = any> {
  execute(input: Input): Promise<Output>;
}
