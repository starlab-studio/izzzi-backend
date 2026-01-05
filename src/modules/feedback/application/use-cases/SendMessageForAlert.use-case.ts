import { BaseUseCase, IUseCase, type ILoggerService } from "src/core";

export interface SendMessageForAlertInput {
  organizationId: string;
  userId: string;
  subjectId: string;
  alertId: string;
}

export interface SendMessageForAlertOutput {
  success: boolean;
  message?: string;
}

export class SendMessageForAlertUseCase
  extends BaseUseCase
  implements IUseCase<SendMessageForAlertInput, SendMessageForAlertOutput>
{
  constructor(readonly logger: ILoggerService) {
    super(logger);
  }

  async execute(
    data: SendMessageForAlertInput
  ): Promise<SendMessageForAlertOutput> {
    try {
      this.logger.info(
        `Sending message for alert ${data.alertId} for subject ${data.subjectId}`
      );

      // TODO: Implémenter la logique d'envoi de message
      // 1. Récupérer les détails de l'alerte
      // 2. Générer un message via IA (optionnel)
      // 3. Envoyer le message aux étudiants concernés via le module Notification

      return {
        success: true,
        message: "Message envoyé avec succès aux étudiants",
      };
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async withCompensation(): Promise<void> {
    // Pas de compensation nécessaire
  }
}
