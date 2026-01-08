import * as fs from "fs";
import * as path from "path";
import * as Handlebars from "handlebars";
import * as crypto from "crypto";

export class GeneralUtils {
  static htmlTemplateReader = (
    templateName: string,
    variables: Record<string, any>,
  ) => {
    const templatePath = path.join(
      __dirname,
      "../../src/templates/",
      templateName,
    );
    const templateContent = fs.readFileSync(templatePath, "utf-8");
    const template = Handlebars.compile(templateContent);
    return template(variables);
  };

  static generateToken(length: number): string {
    return crypto.randomBytes(length).toString("hex");
  }

  static generateSlug(text: string): string {
    return text
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  static parseEmails(emailsString: string): string[] {
    return emailsString
      .split(";")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);
  }

  static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  static verifyToken(token: string, hashedToken: string): boolean {
    const hash = this.hashToken(token);
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hashedToken));
  }
}
