import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { awsS3ClientProvider } from "./infrastructure/config/aws-s3.provider";
import { AwsS3StorageAdapter } from "./infrastructure/adapters/aws-s3-storage.adapter";
import { FileKeyGeneratorAdapter } from "./infrastructure/adapters/file-key-generator.adapter";
import { FileValidatorAdapter } from "./infrastructure/adapters/file-validator.adapter";

import { STORAGE_SERVICE } from "./domain/interfaces/storage.interface";
import { FILE_KEY_GENERATOR } from "./domain/interfaces/file-key-generator.interface";
import { FILE_VALIDATOR } from "./domain/interfaces/file-validator.interface";

import { GenerateUploadUrlUseCase } from "./application/use-cases/generate-upload-url.use-case";
import { GenerateDownloadUrlUseCase } from "./application/use-cases/generate-download-url.use-case";
import { DeleteFileUseCase } from "./application/use-cases/delete-file.use-case";

import { StorageController } from "./interface/controllers/storage.controller";

@Module({
  imports: [ConfigModule],
  controllers: [StorageController],
  providers: [
    awsS3ClientProvider,

    {
      provide: STORAGE_SERVICE,
      useClass: AwsS3StorageAdapter,
    },
    {
      provide: FILE_KEY_GENERATOR,
      useClass: FileKeyGeneratorAdapter,
    },
    {
      provide: FILE_VALIDATOR,
      useClass: FileValidatorAdapter,
    },

    GenerateUploadUrlUseCase,
    GenerateDownloadUrlUseCase,
    DeleteFileUseCase,
  ],
  exports: [
    GenerateUploadUrlUseCase,
    GenerateDownloadUrlUseCase,
    DeleteFileUseCase,
  ],
})
export class StorageModule {}
