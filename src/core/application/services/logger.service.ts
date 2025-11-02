export interface ILoggerService {
  info(message: string): void;
  error(message: string, trace: string): void;
  warn(message: string): void;
}
