import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

describe('Appointment persistence', () => {
  it('declares active-slot uniqueness and a resolved appointment relation', () => {
    const schema = readFileSync(join(__dirname, '../prisma/schema.prisma'), 'utf8');
    const migrationsDirectory = join(__dirname, '../prisma/migrations');
    const migrations = readdirSync(migrationsDirectory)
      .map((directory) => join(migrationsDirectory, directory, 'migration.sql'))
      .filter((path) => {
        try {
          readFileSync(path, 'utf8');
          return true;
        } catch {
          return false;
        }
      })
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n');

    expect(schema).toContain('model Appointment {');
    expect(schema).toContain('model AppointmentRequest {');
    expect(schema).toContain('resolvedAppointmentId Int?');
    expect(schema).toContain('resolvedAppointment   Appointment?');
    expect(migrations).toMatch(
      /CREATE UNIQUE INDEX "appointments_veterinarian_id_scheduled_at_active_key"[\s\S]*WHERE "status" <> 'Cancelada'/,
    );
  });
});
