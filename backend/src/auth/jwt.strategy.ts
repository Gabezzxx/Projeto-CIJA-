import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

@Injectable()
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) {
      throw new Error(
        'A variável de ambiente SUPABASE_JWT_SECRET não foi definida!',
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: SupabaseJwtPayload) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token inválido ou malformado.');
    }

    if (payload.role !== 'authenticated') {
      throw new UnauthorizedException('Acesso não autorizado para esta role.');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log('ERRO NA AUTENTICAÇÃO DO PASSPORT:', info?.message || err);
      throw err || new UnauthorizedException();
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user;
  }
}
