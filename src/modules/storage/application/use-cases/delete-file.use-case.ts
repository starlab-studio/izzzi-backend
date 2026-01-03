import {
  Inject,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { STORAGE_SERVICE } from '../../domain/interfaces/storage.interface';
import type { IStorageService } from '../../domain/interfaces/storage.interface';
import { DeleteFileCommand, DeleteFileResult } from '../dto/delete-file.dto';

@Injectable()
export class DeleteFileUseCase {
  constructor(@Inject(STORAGE_SERVICE) private readonly storageService: IStorageService) {}

  async execute(command: DeleteFileCommand): Promise<DeleteFileResult> {
    try {
      const exists = await this.storageService.fileExists(command.fileKey);
      if (!exists) {
        throw new NotFoundException(`File not found: ${command.fileKey}`);
      }

      await this.storageService.deleteFile(command.fileKey);
      return new DeleteFileResult(true, 'File deleted successfully');
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to delete file: ${error.message}`);
    }
  }
}
