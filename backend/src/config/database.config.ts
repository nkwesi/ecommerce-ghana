import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const url = process.env.DATABASE_URL;
  const useSsl = process.env.DATABASE_SSL
    ? process.env.DATABASE_SSL === 'true'
    : Boolean(url);
  const ca = process.env.DATABASE_CA_CERT_BASE64
    ? Buffer.from(process.env.DATABASE_CA_CERT_BASE64, 'base64').toString('utf8')
    : undefined;

  return {
    url,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    database: process.env.DATABASE_NAME || 'ecommerce_ghana',
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    ssl: useSsl
      ? {
          rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
          ...(ca ? { ca } : {}),
        }
      : false,
    poolMax: parseInt(process.env.DATABASE_POOL_MAX ?? '10', 10),
  };
});
