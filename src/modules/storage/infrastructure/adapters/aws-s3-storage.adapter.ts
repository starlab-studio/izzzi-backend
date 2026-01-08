import { Injectable, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IStorageService } from "../../domain/interfaces/storage.interface";
import { FileMetadata } from "../../domain/value-objects/file-metadata.vo";
import { PresignedUrlEntity } from "../../domain/entities/presigned-url.entity";

export const AWS_S3_CLIENT = "AWS_S3_CLIENT";

@Injectable()
export class AwsS3StorageAdapter implements IStorageService {
  private readonly bucket: string;
  private readonly region: string;

  constructor(
    @Inject(AWS_S3_CLIENT) private readonly s3Client: S3Client,
    private readonly configService: ConfigService,
  ) {
    const bucket = this.configService.get<string>("aws.bucket");
    const region = this.configService.get<string>("aws.region");

    if (!bucket) {
      throw new Error("AWS S3 bucket is not configured");
    }
    if (!region) {
      throw new Error("AWS region is not configured");
    }

    this.bucket = bucket;
    this.region = region;
  }

  async generateUploadUrl(
    fileKey: string,
    metadata: FileMetadata,
    expiresIn: number,
  ): Promise<PresignedUrlEntity> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      ContentType: metadata.mimeType,
    });

    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn,
      signableHeaders: new Set(["host"]),
    });

    return new PresignedUrlEntity(url, expiresIn);
  }

  async generateDownloadUrl(
    fileKey: string,
    expiresIn: number,
  ): Promise<PresignedUrlEntity> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });

    return new PresignedUrlEntity(url, expiresIn);
  }

  async fileExists(fileKey: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (
        error.name === "NotFound" ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      throw error;
    }
  }

  async deleteFile(fileKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
    });

    await this.s3Client.send(command);
  }

  getPublicUrl(fileKey: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileKey.replace(/^\/+/, "")}`;
  }
}
