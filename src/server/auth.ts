import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { dbStore } from './db';
import { User, UserRole } from '../types/index';

const JWT_SECRET = process.env.JWT_SECRET || 'cryptic_super_secret_jwt_key_982314';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  exp: number;
}

export function generateToken(user: User): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload: AuthTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  };
  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payloadEncoded}`).digest('base64url');
  return `${header}.${payloadEncoded}.${signature}`;
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payloadEncoded, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payloadEncoded}`).digest('base64url');
    if (signature !== expectedSig) return null;

    const payload: AuthTokenPayload = JSON.parse(Buffer.from(payloadEncoded, 'base64url').toString('utf8'));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, error: 'Invalid or expired session token' });
  }

  const user = dbStore.users.get(payload.userId);
  if (!user) {
    return res.status(401).json({ success: false, error: 'User account not found' });
  }

  if (user.isSuspended) {
    return res.status(403).json({ success: false, error: 'Account has been administratively suspended' });
  }

  // Strip password hash before attaching to request
  const { passwordHash, ...safeUser } = user;
  req.user = safeUser as User;
  next();
}

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      dbStore.logAudit({
        adminId: req.user.id,
        adminEmail: req.user.email,
        action: 'UNAUTHORIZED_PRIVILEGE_ATTEMPT',
        targetType: 'API_Route',
        targetId: req.path,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1',
        metadata: { path: req.path, attemptedRole: req.user.role, requiredRoles: allowedRoles },
      });

      return res.status(403).json({
        success: false,
        error: `Access Denied: High-security administrative route. Only authenticated admins have access.`,
      });
    }

    next();
  };
}
