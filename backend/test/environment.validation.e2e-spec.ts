import { validateEnvironment } from '../src/config/environment.validation';

describe('environment validation', () => {
  it('requires a PostgreSQL DATABASE_URL', () => {
    expect(() =>
      validateEnvironment({
        CORS_ORIGINS: 'http://localhost:5173',
        NODE_ENV: 'test',
        PORT: '3000',
      }),
    ).toThrow('DATABASE_URL must be a valid PostgreSQL connection string.');
  });
});
