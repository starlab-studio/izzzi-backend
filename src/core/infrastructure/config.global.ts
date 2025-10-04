export default () => ({
  port: parseInt(process.env.PORT || "3000", 10),
  database: {
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "5432", 10),
    dbname: process.env.DATABASE_NAME || "postgres",
    username: process.env.DATABASE_USER || "postgres",
    password: process.env.DATABASE_PASSWORD || "postgres",
    synchronize: false,
  },
});
