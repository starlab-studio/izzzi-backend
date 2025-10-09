import { DataSource } from "typeorm";
import AppConfig from "./core/interfaces/config.global";

import * as dotenv from "dotenv";

dotenv.config();

const appConfig = AppConfig();
export const AppDataSource = new DataSource({
  type: "postgres",
  host: appConfig.database.host,
  port: appConfig.database.port,
  database: appConfig.database.dbname,
  username: appConfig.database.username,
  password: appConfig.database.password,
  synchronize: false,
  entities: ["src/**/*.model.ts"],
  migrations: ["src/migrations/*.ts"],
  migrationsTableName: "custom_migration_table",
});
