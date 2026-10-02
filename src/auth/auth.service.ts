import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyTwoFactorDto } from './dto/two-factor.dto';
import { TwoFactorService } from './two-factor.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existing = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });
    if (existing) {
      throw new ConflictException('Ya existe un usuario con este email');
    }
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = this.userRepository.create({
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
    });
    const saved = await this.userRepository.save(user);
    const { password: _, ...result } = saved;
    const access_token = this.jwtService.sign({
      sub: saved.id,
      email: saved.email,
    });
    return { user: result, access_token };
  }

  /**
   * Si el usuario tiene 2FA activo no devuelve el JWT: envía un código por
   * email y devuelve un twoFactorToken para completar en /auth/2fa/verify.
   */
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (user.twoFactorEnabled) {
      return this.twoFactorService.startLoginChallenge(user);
    }
    return { requiresTwoFactor: false as const, ...this.createSession(user) };
  }

  async verifyTwoFactorLogin(dto: VerifyTwoFactorDto) {
    const userId = await this.twoFactorService.verifyLogin(dto);
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return this.createSession(user);
  }

  private createSession(user: User) {
    const access_token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
    const { password: _, ...result } = user;
    return { user: result, access_token };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }
    return user;
  }
}
