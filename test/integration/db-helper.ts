import { DataSource } from "typeorm";

export async function waitForDatabase(
  dataSource: DataSource,
  maxRetries = 10,
  delayMs = 1000
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (dataSource.isInitialized) {
        await dataSource.query("SELECT 1");
        return;
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error(
          `Database not ready after ${maxRetries} attempts: ${error}`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

