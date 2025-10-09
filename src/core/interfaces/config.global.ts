export default () => ({
  env: process.env.NODE_ENVIRONMENT,
  port: parseInt(process.env.PORT || "3000", 10),
  database: {
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "5432", 10),
    dbname: process.env.DATABASE_NAME || "postgres",
    username: process.env.DATABASE_USER || "postgres",
    password: process.env.DATABASE_PASSWORD || "postgres",
    synchronize: false,
  },
  auth: {
    provider: process.env.AUTH_PROVIDER || "AWS_COGNITO",
  },
  aws: {
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    cognito: {
      clientId: process.env.AWS_COGNITO_USER_POOL_CLIENT_ID!,
      clientSecret: process.env.AWS_COGNITO_USER_POOL_CLIENT_SECRET!,
    },
  },
});
