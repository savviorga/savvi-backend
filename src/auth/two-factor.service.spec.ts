import {
  BadRequestException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { TwoFactorService } from './two-factor.service';
import { User } from './entities/user.entity';
import { TwoFactorChallenge } from './entities/two-factor-challenge.entity';
import { EmailService } from '../email/email.service';
import { sha256 } from './utils/otp.util';

describe('TwoFactorService', () => {
  let service: TwoFactorService;

  const user = {
    id: 'user-1',
    name: 'Juan',
    email: 'juan@savvi.com',
    password: '',
    twoFactorEnabled: false,
  } as User;

  const queryBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };
  const userRepository = { findOne: jest.fn(), update: jest.fn() };
  const challengeRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
    create: jest.fn((v) => v),
    save: jest.fn((v) => ({ id: 'ch-1', ...v })),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => queryBuilder),
  };
  const emailService = { sendTwoFactorCode: jest.fn() };

  const challenge = (overrides: Partial<TwoFactorChallenge> = {}) =>
    ({
      id: 'ch-1',
      userId: user.id,
      purpose: 'login',
      codeHash: sha256('123456'),
      tokenHash: sha256('token'),
      attempts: 0,
      sendCount: 1,
      expiresAt: new Date(Date.now() + 60_000),
      lastSentAt: new Date(Date.now() - 120_000),
      usedAt: null,
      ...overrides,
    }) as TwoFactorChallenge;

  beforeEach(async () => {
    jest.clearAllMocks();
    challengeRepository.update.mockResolvedValue({ affected: 1 });
    queryBuilder.execute.mockResolvedValue({ affected: 1 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        {
          provide: getRepositoryToken(TwoFactorChallenge),
          useValue: challengeRepository,
        },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();
    service = module.get(TwoFactorService);
  });

  describe('login', () => {
    it('crea el reto, guarda hashes y envía el código', async () => {
      challengeRepository.findOne.mockResolvedValue(null);

      const res = await service.startLoginChallenge(user);

      expect(res.requiresTwoFactor).toBe(true);
      const [to, data] = emailService.sendTwoFactorCode.mock.calls[0];
      expect(to).toBe(user.email);
      expect(data).toMatchObject({ purpose: 'login' });
      const saved = challengeRepository.save.mock.calls[0][0];
      expect(saved.codeHash).toBe(sha256(data.code));
      expect(saved.tokenHash).toBe(sha256(res.twoFactorToken));
    });

    it('responde 429 si ya se envió un código hace menos de 60 s', async () => {
      challengeRepository.findOne.mockResolvedValue(
        challenge({ lastSentAt: new Date() }),
      );
      await expect(service.startLoginChallenge(user)).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
      });
      expect(emailService.sendTwoFactorCode).not.toHaveBeenCalled();
    });

    it('borra el reto si falla el envío', async () => {
      challengeRepository.findOne.mockResolvedValue(null);
      emailService.sendTwoFactorCode.mockRejectedValueOnce(new Error('down'));
      await expect(service.startLoginChallenge(user)).rejects.toThrow();
      expect(challengeRepository.delete).toHaveBeenCalledWith('ch-1');
    });

    it('verifica el código y devuelve el userId', async () => {
      challengeRepository.findOne.mockResolvedValue(challenge());
      await expect(
        service.verifyLogin({ twoFactorToken: 'token', code: '123456' }),
      ).resolves.toBe(user.id);
    });

    it('rechaza un código incorrecto indicando intentos restantes', async () => {
      challengeRepository.findOne.mockResolvedValue(challenge({ attempts: 2 }));
      await expect(
        service.verifyLogin({ twoFactorToken: 'token', code: '000000' }),
      ).rejects.toThrow('Te quedan 2 intentos');
    });

    it('bloquea al agotar los intentos', async () => {
      challengeRepository.findOne.mockResolvedValue(challenge({ attempts: 5 }));
      queryBuilder.execute.mockResolvedValue({ affected: 0 });
      await expect(
        service.verifyLogin({ twoFactorToken: 'token', code: '123456' }),
      ).rejects.toThrow('Vuelve a iniciar sesión');
    });

    it('rechaza un token de reto inexistente o expirado', async () => {
      challengeRepository.findOne.mockResolvedValue(
        challenge({ expiresAt: new Date(Date.now() - 1000) }),
      );
      await expect(
        service.verifyLogin({ twoFactorToken: 'token', code: '123456' }),
      ).rejects.toThrow('El inicio de sesión expiró');
    });

    it('rechaza si el reto ya fue consumido por otra petición', async () => {
      challengeRepository.findOne.mockResolvedValue(challenge());
      challengeRepository.update.mockResolvedValueOnce({ affected: 0 });
      await expect(
        service.verifyLogin({ twoFactorToken: 'token', code: '123456' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('reenvía un código nuevo y reinicia los intentos', async () => {
      challengeRepository.findOne.mockResolvedValue(challenge({ attempts: 3 }));
      userRepository.findOne.mockResolvedValue(user);

      await service.resendLogin({ twoFactorToken: 'token' });

      const [, changes] = challengeRepository.update.mock.calls[0];
      const [, data] = emailService.sendTwoFactorCode.mock.calls[0];
      expect(changes).toMatchObject({ attempts: 0, sendCount: 2 });
      expect(changes.codeHash).toBe(sha256(data.code));
    });

    it('no reenvía al alcanzar el máximo de envíos', async () => {
      challengeRepository.findOne.mockResolvedValue(
        challenge({ sendCount: 5 }),
      );
      userRepository.findOne.mockResolvedValue(user);
      await expect(
        service.resendLogin({ twoFactorToken: 'token' }),
      ).rejects.toThrow('límite de reenvíos');
      expect(emailService.sendTwoFactorCode).not.toHaveBeenCalled();
    });

    it('no reenvía antes de 60 s', async () => {
      challengeRepository.findOne.mockResolvedValue(
        challenge({ lastSentAt: new Date() }),
      );
      userRepository.findOne.mockResolvedValue(user);
      await expect(
        service.resendLogin({ twoFactorToken: 'token' }),
      ).rejects.toBeInstanceOf(HttpException);
    });
  });

  describe('activar / desactivar', () => {
    it('envía el código de activación', async () => {
      userRepository.findOne.mockResolvedValue(user);
      challengeRepository.findOne.mockResolvedValue(null);

      await service.startEnable(user.id);

      expect(emailService.sendTwoFactorCode.mock.calls[0][1]).toMatchObject({
        purpose: 'enable',
      });
      expect(challengeRepository.save.mock.calls[0][0].tokenHash).toBeNull();
    });

    it('no permite activar si ya está activo', async () => {
      userRepository.findOne.mockResolvedValue({
        ...user,
        twoFactorEnabled: true,
      });
      await expect(service.startEnable(user.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('activa el 2FA con el código correcto', async () => {
      challengeRepository.findOne.mockResolvedValue(
        challenge({ purpose: 'enable', tokenHash: null }),
      );

      const res = await service.confirmEnable(user.id, { code: '123456' });

      expect(res.twoFactorEnabled).toBe(true);
      expect(userRepository.update).toHaveBeenCalledWith(user.id, {
        twoFactorEnabled: true,
      });
    });

    it('no activa con un código incorrecto', async () => {
      challengeRepository.findOne.mockResolvedValue(
        challenge({ purpose: 'enable', tokenHash: null }),
      );
      await expect(
        service.confirmEnable(user.id, { code: '000000' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('desactiva con la contraseña correcta', async () => {
      userRepository.findOne.mockResolvedValue({
        ...user,
        twoFactorEnabled: true,
        password: await bcrypt.hash('MiClave123', 4),
      });

      await service.disable(user.id, { password: 'MiClave123' });

      expect(userRepository.update).toHaveBeenCalledWith(user.id, {
        twoFactorEnabled: false,
      });
    });

    it('no desactiva con una contraseña incorrecta', async () => {
      userRepository.findOne.mockResolvedValue({
        ...user,
        twoFactorEnabled: true,
        password: await bcrypt.hash('MiClave123', 4),
      });
      await expect(
        service.disable(user.id, { password: 'otra' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });
});
