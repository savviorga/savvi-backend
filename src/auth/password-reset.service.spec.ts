import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PasswordResetService } from './password-reset.service';
import { User } from './entities/user.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { EmailService } from '../email/email.service';

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

describe('PasswordResetService', () => {
  let service: PasswordResetService;

  const user = { id: 'user-1', name: 'Juan', email: 'juan@savvi.com' };

  const queryBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };
  const userRepository = { findOne: jest.fn() };
  const passwordResetRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
    create: jest.fn((v) => v),
    save: jest.fn((v) => ({ id: 'reset-1', ...v })),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => queryBuilder),
  };
  const emailService = { sendPasswordResetCode: jest.fn() };
  const manager = { update: jest.fn() };
  const dataSource = {
    transaction: jest.fn((cb: (m: typeof manager) => unknown) => cb(manager)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        {
          provide: getRepositoryToken(PasswordReset),
          useValue: passwordResetRepository,
        },
        { provide: EmailService, useValue: emailService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get(PasswordResetService);
  });

  describe('requestReset', () => {
    it('no envía email si el usuario no existe, pero responde igual', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const res = await service.requestReset({ email: 'x@savvi.com' });
      expect(res.message).toBeDefined();
      expect(emailService.sendPasswordResetCode).not.toHaveBeenCalled();
    });

    it('guarda el hash del código y envía el código en claro', async () => {
      userRepository.findOne.mockResolvedValue(user);
      passwordResetRepository.findOne.mockResolvedValue(null);

      await service.requestReset({ email: user.email });

      const [to, data] = emailService.sendPasswordResetCode.mock.calls[0];
      expect(to).toBe(user.email);
      expect(data.code).toMatch(/^\d{6}$/);
      const saved = passwordResetRepository.save.mock.calls[0][0];
      expect(saved.codeHash).toBe(sha256(data.code));
      expect(saved.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('no reenvía dentro del cooldown', async () => {
      userRepository.findOne.mockResolvedValue(user);
      passwordResetRepository.findOne.mockResolvedValue({
        createdAt: new Date(),
      });
      await service.requestReset({ email: user.email });
      expect(emailService.sendPasswordResetCode).not.toHaveBeenCalled();
    });

    it('borra el registro si falla el envío', async () => {
      userRepository.findOne.mockResolvedValue(user);
      passwordResetRepository.findOne.mockResolvedValue(null);
      emailService.sendPasswordResetCode.mockRejectedValueOnce(
        new Error('down'),
      );
      await expect(
        service.requestReset({ email: user.email }),
      ).rejects.toThrow();
      expect(passwordResetRepository.delete).toHaveBeenCalledWith('reset-1');
    });
  });

  describe('verifyCode', () => {
    const openReset = (attempts = 0) => ({
      id: 'reset-1',
      userId: user.id,
      codeHash: sha256('123456'),
      attempts,
      expiresAt: new Date(Date.now() + 60_000),
    });

    beforeEach(() => userRepository.findOne.mockResolvedValue(user));

    it('devuelve un resetToken y guarda su hash', async () => {
      passwordResetRepository.findOne.mockResolvedValue(openReset());
      queryBuilder.execute.mockResolvedValue({ affected: 1 });

      const res = await service.verifyCode({
        email: user.email,
        code: '123456',
      });

      expect(res.resetToken).toHaveLength(64);
      expect(passwordResetRepository.update).toHaveBeenCalledWith(
        'reset-1',
        expect.objectContaining({ resetTokenHash: sha256(res.resetToken) }),
      );
    });

    it('rechaza un código incorrecto indicando intentos restantes', async () => {
      passwordResetRepository.findOne.mockResolvedValue(openReset(1));
      queryBuilder.execute.mockResolvedValue({ affected: 1 });
      await expect(
        service.verifyCode({ email: user.email, code: '000000' }),
      ).rejects.toThrow('Te quedan 3 intentos');
    });

    it('bloquea al superar el máximo de intentos', async () => {
      passwordResetRepository.findOne.mockResolvedValue(openReset(5));
      queryBuilder.execute.mockResolvedValue({ affected: 0 });
      await expect(
        service.verifyCode({ email: user.email, code: '123456' }),
      ).rejects.toThrow('Demasiados intentos');
    });

    it('rechaza un código expirado', async () => {
      passwordResetRepository.findOne.mockResolvedValue({
        ...openReset(),
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(
        service.verifyCode({ email: user.email, code: '123456' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('resetPassword', () => {
    it('actualiza la contraseña e invalida el token', async () => {
      passwordResetRepository.findOne.mockResolvedValue({
        id: 'reset-1',
        userId: user.id,
        resetTokenExpiresAt: new Date(Date.now() + 60_000),
      });
      manager.update.mockResolvedValue({ affected: 1 });

      await service.resetPassword({
        resetToken: 'token',
        newPassword: 'NuevaClave1',
      });

      const userUpdate = manager.update.mock.calls.find(
        ([entity]) => entity === User,
      );
      expect(await bcrypt.compare('NuevaClave1', userUpdate[2].password)).toBe(
        true,
      );
      expect(manager.update).toHaveBeenCalledWith(
        PasswordReset,
        expect.objectContaining({ id: 'reset-1' }),
        expect.objectContaining({ usedAt: expect.any(Date) }),
      );
    });

    it('rechaza un token expirado', async () => {
      passwordResetRepository.findOne.mockResolvedValue({
        id: 'reset-1',
        userId: user.id,
        resetTokenExpiresAt: new Date(Date.now() - 1000),
      });
      await expect(
        service.resetPassword({ resetToken: 'token', newPassword: 'abcdef' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('rechaza un token ya usado (carrera)', async () => {
      passwordResetRepository.findOne.mockResolvedValue({
        id: 'reset-1',
        userId: user.id,
        resetTokenExpiresAt: new Date(Date.now() + 60_000),
      });
      manager.update.mockResolvedValueOnce({ affected: 0 });
      await expect(
        service.resetPassword({ resetToken: 'token', newPassword: 'abcdef' }),
      ).rejects.toThrow('ya fue utilizada');
    });
  });
});
