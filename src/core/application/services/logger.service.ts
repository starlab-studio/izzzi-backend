export interface ILoggerService {
  log(message: string): void;
  error(message: string, trace: string): void;
  warn(message: string): void;
}
