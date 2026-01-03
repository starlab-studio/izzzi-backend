export default () => ({
  node_env: process.env.NODE_ENVIRONMENT,
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
    bucket: process.env.AWS_S3_BUCKET!,
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
  nofitication: {
    email_provider: { key: process.env.BREVO_API_KEY },
  },
  frontend: {
    url: process.env.FRONTEND_DOMAIN_URL,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
});
