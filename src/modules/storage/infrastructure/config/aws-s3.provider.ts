import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { AWS_S3_CLIENT } from '../adapters/aws-s3-storage.adapter';

export const awsS3ClientProvider = {
  provide: AWS_S3_CLIENT,
  useFactory: (configService: ConfigService) => {
    const region = configService.get<string>('aws.region');
    const accessKeyId = configService.get<string>('aws.credentials.accessKeyId');
    const secretAccessKey = configService.get<string>('aws.credentials.secretAccessKey');

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error('AWS S3 credentials are not properly configured. Please set AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY environment variables.');
    }

    return new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      // Désactiver le checksum pour les URLs présignées (compatibilité navigateur)
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  },
  inject: [ConfigService],
};
