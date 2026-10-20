import { HttpException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import type { User } from './entities/user.entity';

describe('AuthService – bloqueo por intentos fallidos', () => {
  let service: AuthService;
  let current: Partial<User> | null;
  let userRepository: { createQueryBuilder: jest.Mock; update: jest.Mock };

  beforeEach(async () => {
    current = {
      id: 'u1',
      email: 'ana@savvi.co',
      password: await bcrypt.hash('secreta123', 4),
      failedLoginAttempts: 0,
      lockedUntil: null,
    };
    const qb = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(() => Promise.resolve(current ? { ...current } : null)),
    };
    userRepository = {
      createQueryBuilder: jest.fn(() => qb),
      update: jest.fn((_id: string, patch: Partial<User>) => {
        current = { ...current, ...patch };
        return Promise.resolve({ affected: 1 });
      }),
    };
    service = new AuthService(
      userRepository as never,
      { sign: jest.fn(() => 'token') } as never,
      {} as never,
    );
  });

  it('cuenta los fallos y bloquea al décimo', async () => {
    for (let i = 0; i < 9; i += 1) {
      await expect(
        service.validateUser('ana@savvi.co', 'mala'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    }
    expect(current?.failedLoginAttempts).toBe(9);

    await expect(
      service.validateUser('ana@savvi.co', 'mala'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(current?.lockedUntil).toBeInstanceOf(Date);
    expect(current?.failedLoginAttempts).toBe(0);

    // Bloqueada: ni la contraseña correcta entra.
    const locked = service.validateUser('ana@savvi.co', 'secreta123');
    await expect(locked).rejects.toBeInstanceOf(HttpException);
    await expect(locked).rejects.toMatchObject({ status: 429 });
  });

  it('el login correcto reinicia el contador', async () => {
    current = { ...current, failedLoginAttempts: 4 };
    await expect(
      service.validateUser('ana@savvi.co', 'secreta123'),
    ).resolves.toMatchObject({ id: 'u1' });
    expect(current?.failedLoginAttempts).toBe(0);
  });

  it('un bloqueo vencido no impide entrar', async () => {
    current = { ...current, lockedUntil: new Date(Date.now() - 1000) };
    await expect(
      service.validateUser('ana@savvi.co', 'secreta123'),
    ).resolves.toMatchObject({ id: 'u1' });
    expect(current?.lockedUntil).toBeNull();
  });
});
