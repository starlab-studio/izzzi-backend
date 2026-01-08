import * as QRCode from "qrcode";

export class QRCodeService {
  /**
   * Génère une URL de QR code pour une URL publique donnée
   * Retourne une data URL (base64) qui peut être utilisée directement dans une balise <img>
   */
  static async generateQRCodeDataURL(publicUrl: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(publicUrl, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: "M",
      });
      return qrCodeDataURL;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error}`);
    }
  }

  /**
   * Génère un buffer de QR code pour une URL publique donnée
   * Utile pour sauvegarder dans S3 ou retourner directement
   */
  static async generateQRCodeBuffer(publicUrl: string): Promise<Buffer> {
    try {
      const qrCodeBuffer = await QRCode.toBuffer(publicUrl, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: "M",
      });
      return qrCodeBuffer;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error}`);
    }
  }
}
