import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
import { getJwtSecret } from '../../config/env';

/**
 * Las peticiones con un JWT válido se limitan por usuario y el resto por IP.
 * Así Savvi IA (que llama a la API desde el servidor de Next, con una sola
 * IP) no comparte el cupo entre todos los usuarios.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  private jwt?: JwtService;

  protected getTracker(req: Record<string, any>): Promise<string> {
    const authorization: unknown = req.headers?.authorization;
    if (
      typeof authorization === 'string' &&
      authorization.startsWith('Bearer ')
    ) {
      try {
        this.jwt ??= new JwtService({ secret: getJwtSecret() });
        const payload = this.jwt.verify<{ sub?: string }>(
          authorization.slice('Bearer '.length),
        );
        if (payload?.sub) return Promise.resolve(`user:${payload.sub}`);
      } catch {
        // Token inválido o vencido: cuenta por IP.
      }
    }
    return super.getTracker(req);
  }
}
