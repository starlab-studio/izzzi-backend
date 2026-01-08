import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import { type ILoggerService } from "src/core";

export interface FeedbackSummaryResponse {
  summary: string;
  full_summary?: string;
  generated_at: string;
}

// Type pour la réponse brute du service langchain
export interface FeedbackAlertResponse {
  id: string;
  type: "negative" | "alert";
  number: string;
  content: string;
  title: string;
  priority: string;
  timestamp: string;
}

// Type pour la réponse brute du service langchain
export interface FeedbackAlertsResponseRaw {
  alerts: FeedbackAlertResponse[];
}

// Type pour les alertes mappées au format du domaine
export interface MappedFeedbackAlert {
  id: string;
  type: "negative" | "positive";
  number: string;
  content: string;
  timestamp: string;
  isProcessed: boolean;
}

export interface FeedbackAlertsResponse {
  alerts: MappedFeedbackAlert[];
}

@Injectable()
export class AiClientService {
  private readonly baseUrl: string;
  private readonly axiosInstance: AxiosInstance;
  private readonly logger: Logger;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: ILoggerService,
  ) {
    this.baseUrl =
      this.configService.get<string>("aiService.url") ||
      process.env.AI_SERVICE_URL ||
      "http://localhost:8000";

    this.logger = new Logger(AiClientService.name);

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 secondes
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Récupère le résumé IA des feedbacks pour une matière
   */
  async getFeedbackSummary(
    subjectId: string,
    periodDays: number = 30,
    jwtToken: string,
  ): Promise<FeedbackSummaryResponse> {
    try {
      this.logger.debug(
        `Fetching feedback summary for subject ${subjectId} from AI service`,
      );

      const response = await this.axiosInstance.get<FeedbackSummaryResponse>(
        `/api/v1/feedback/subjects/${subjectId}/summary`,
        {
          params: {
            period_days: periodDays,
          },
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        },
      );

      return response.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Error fetching feedback summary from AI service: ${errorMessage}`,
      );

      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "status" in error.response
      ) {
        // Erreur HTTP de l'API
        const statusCode =
          typeof error.response.status === "number"
            ? error.response.status
            : HttpStatus.INTERNAL_SERVER_ERROR;
        throw new HttpException(
          {
            message: "AI service error",
            details: "data" in error.response ? error.response.data : undefined,
          },
          statusCode,
        );
      } else if (error && typeof error === "object" && "request" in error) {
        // Pas de réponse (service indisponible)
        throw new HttpException(
          {
            message: "AI service unavailable",
            details: "The AI analysis service is not responding",
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      } else {
        // Erreur de configuration
        throw new HttpException(
          {
            message: "AI service configuration error",
            details: errorMessage,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  /**
   * Récupère les alertes IA pour une matière
   */
  async getFeedbackAlerts(
    subjectId: string,
    periodDays: number = 30,
    jwtToken: string,
  ): Promise<FeedbackAlertsResponse> {
    try {
      this.logger.debug(
        `Fetching feedback alerts for subject ${subjectId} from AI service`,
      );

      const response = await this.axiosInstance.get<FeedbackAlertsResponseRaw>(
        `/api/v1/feedback/subjects/${subjectId}/alerts`,
        {
          params: {
            period_days: periodDays,
          },
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        },
      );

      // Mapper les alertes au format attendu par le frontend
      // Le service langchain retourne des alertes avec title et priority
      // On les mappe au format FeedbackAlert du domaine
      const mappedAlerts: MappedFeedbackAlert[] = response.data.alerts.map(
        (alert) => ({
          id: alert.id,
          type: alert.type === "alert" ? "negative" : alert.type,
          number: alert.number,
          content: alert.content,
          timestamp: alert.timestamp,
          isProcessed: false, // Par défaut, non traité
        }),
      );

      return { alerts: mappedAlerts };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Error fetching feedback alerts from AI service: ${errorMessage}`,
      );

      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "status" in error.response
      ) {
        const statusCode =
          typeof error.response.status === "number"
            ? error.response.status
            : HttpStatus.INTERNAL_SERVER_ERROR;
        throw new HttpException(
          {
            message: "AI service error",
            details: "data" in error.response ? error.response.data : undefined,
          },
          statusCode,
        );
      } else if (error && typeof error === "object" && "request" in error) {
        throw new HttpException(
          {
            message: "AI service unavailable",
            details: "The AI analysis service is not responding",
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      } else {
        throw new HttpException(
          {
            message: "AI service configuration error",
            details: errorMessage,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
