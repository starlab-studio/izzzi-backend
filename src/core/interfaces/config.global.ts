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
    jwt: {
      secret: process.env.AUTH_JWT_SECRET || "MY_JWT_SECRET",
      expiresIn: process.env.AUTH_JWT_EXPIRES_IN || "15m",
      refreshSecret: process.env.AUTH_JWT_REFRESH_SECRET || "MY_REFRESH_SECRET",
      refreshExpiresIn: process.env.AUTH_JWT_REFRESH_EXPIRES_IN || "7d",
    },
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
      userPoolId: process.env.AWS_COGNITO_USER_POOL_ID!,
    },
  },
});
