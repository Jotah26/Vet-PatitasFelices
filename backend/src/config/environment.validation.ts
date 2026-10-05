export type Environment = {
  CORS_ORIGINS: string;
  DATABASE_URL: string;
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
};

export function validateEnvironment(config: Record<string, unknown>): Environment {
  const nodeEnvironment = config.NODE_ENV ?? 'development';
  if (!['development', 'test', 'production'].includes(String(nodeEnvironment))) {
    throw new Error('NODE_ENV must be development, test, or production.');
  }

  const port = Number(config.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  const databaseUrl = String(config.DATABASE_URL ?? '');
  try {
    const parsedDatabaseUrl = new URL(databaseUrl);
    if (!['postgres:', 'postgresql:'].includes(parsedDatabaseUrl.protocol)) {
      throw new Error();
    }
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string.');
  }

  const origins = String(config.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (origins.length === 0) {
    throw new Error('CORS_ORIGINS must contain at least one origin.');
  }

  return {
    NODE_ENV: nodeEnvironment as Environment['NODE_ENV'],
    PORT: port,
    CORS_ORIGINS: origins.join(','),
    DATABASE_URL: databaseUrl,
  };
}
