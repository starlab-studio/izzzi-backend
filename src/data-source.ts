import { DataSource } from "typeorm";
import AppConfig from "./core/interfaces/config.global";

import * as dotenv from "dotenv";

dotenv.config();

const appConfig = AppConfig();
// data-source.ts
export const AppDataSource = new DataSource({
  type: "postgres",
  host: appConfig.database.host,
  port: appConfig.database.port,
  database: appConfig.database.dbname,
  username: appConfig.database.username,
  password: appConfig.database.password,
  synchronize: false,
  entities: ["dist/**/*.model.js"], // ← Changer vers les fichiers compilés
  migrations: ["dist/migrations/*.js"], // ← Changer vers les fichiers compilés
  migrationsTableName: "custom_migration_table",
});
