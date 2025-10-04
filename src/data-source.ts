import { DataSource } from "typeorm";
import configGlobal from "./core/infrastructure/config.global";

const config = configGlobal();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: config.database.host,
  port: config.database.port,
  database: config.database.dbname,
  username: config.database.username,
  password: config.database.password,
  synchronize: false,
  entities: ["src/**/*.entity.ts"],
  migrations: ["src/migrations/*.ts"],
  migrationsTableName: "custom_migration_table",
});
