import * as fs from "fs";
import * as path from "path";
import * as Handlebars from "handlebars";

export class GeneralUtils {
  static htmlTemplateReader = (
    templateName: string,
    variables: Record<string, any>
  ) => {
    const templatePath = path.join(
      __dirname,
      "../../src/templates/",
      templateName
    );
    const templateContent = fs.readFileSync(templatePath, "utf-8");
    const template = Handlebars.compile(templateContent);
    return template(variables);
  };
}
