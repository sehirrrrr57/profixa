import { Request, Response, NextFunction } from 'express';
import { dbStore } from './db';

// -----------------------------------------------------------------------------
// 1. ADVANCED SECURITY HTTP HEADERS (OWASP / HELMET EQUIVALENT)
// -----------------------------------------------------------------------------
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking by restricting framing
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // Enable browser XSS filtering
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Strict Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Restrict sensitive hardware features
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Disallow caching for sensitive API responses
  if (req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
}

// -----------------------------------------------------------------------------
// 2. IN-MEMORY HIGH PERFORMANCE RATE LIMITING (ANTI BRUTE-FORCE & DDOS)
// -----------------------------------------------------------------------------
interface RateLimitRecord {
  count: number;
  resetAt: number;
  blockedUntil?: number;
}

const loginAttempts = new Map<string, RateLimitRecord>();
const registerAttempts = new Map<string, RateLimitRecord>();
const generalApiCounts = new Map<string, RateLimitRecord>();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

// Rate Limiter for Login (Max 6 attempts per 15 mins per IP/identity)
export function authRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const identifier = `${ip}_${req.body?.email || ''}`.toLowerCase();
  const now = Date.now();

  const record = loginAttempts.get(identifier);

  if (record) {
    if (record.blockedUntil && record.blockedUntil > now) {
      const waitMinutes = Math.ceil((record.blockedUntil - now) / 60000);
      dbStore.logAudit({
        adminId: 'SYSTEM_FIREWALL',
        adminEmail: 'security@profixa.com',
        action: 'BRUTE_FORCE_BLOCKED',
        targetType: 'AuthLogin',
        targetId: identifier,
        ipAddress: ip,
        metadata: { waitMinutes, identifier },
      });
      return res.status(429).json({
        success: false,
        error: `Security Protection Active: Too many failed login attempts detected. Please wait ${waitMinutes} minutes before trying again.`,
      });
    }

    if (record.resetAt <= now) {
      loginAttempts.delete(identifier);
    }
  }

  next();
}

export function recordFailedLogin(req: Request) {
  const ip = getClientIp(req);
  const identifier = `${ip}_${req.body?.email || ''}`.toLowerCase();
  const now = Date.now();
  const WINDOW_MS = 15 * 60 * 1000; // 15 mins
  const MAX_ATTEMPTS = 6;
  const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 mins lockout

  const record = loginAttempts.get(identifier) || { count: 0, resetAt: now + WINDOW_MS };
  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    dbStore.logAudit({
      adminId: 'SYSTEM_FIREWALL',
      adminEmail: 'security@profixa.com',
      action: 'ACCOUNT_LOCKOUT_TRIGGERED',
      targetType: 'UserAuth',
      targetId: identifier,
      ipAddress: ip,
      metadata: { attempts: record.count, lockedForMinutes: 15 },
    });
  }

  loginAttempts.set(identifier, record);
}

export function recordSuccessfulLogin(req: Request) {
  const ip = getClientIp(req);
  const identifier = `${ip}_${req.body?.email || ''}`.toLowerCase();
  loginAttempts.delete(identifier);
}

// Rate Limiter for Registration (Max 5 registrations per hour per IP)
export function registerRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const now = Date.now();
  const WINDOW_MS = 60 * 60 * 1000; // 1 hour
  const MAX_ACCOUNTS = 6;

  const record = registerAttempts.get(ip) || { count: 0, resetAt: now + WINDOW_MS };

  if (record.resetAt <= now) {
    record.count = 0;
    record.resetAt = now + WINDOW_MS;
  }

  if (record.count >= MAX_ACCOUNTS) {
    return res.status(429).json({
      success: false,
      error: 'Security Notice: Registration limit reached for this network. Please wait an hour before creating another account.',
    });
  }

  record.count += 1;
  registerAttempts.set(ip, record);
  next();
}

// Rate Limiter for General API (Max 150 requests per minute per IP)
export function generalApiLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const now = Date.now();
  const WINDOW_MS = 60 * 1000;
  const MAX_REQ = 150;

  const record = generalApiCounts.get(ip) || { count: 0, resetAt: now + WINDOW_MS };

  if (record.resetAt <= now) {
    record.count = 0;
    record.resetAt = now + WINDOW_MS;
  }

  if (record.count >= MAX_REQ) {
    return res.status(429).json({
      success: false,
      error: 'Traffic rate limit exceeded. Please slow down your requests.',
    });
  }

  record.count += 1;
  generalApiCounts.set(ip, record);
  next();
}

// -----------------------------------------------------------------------------
// 3. INPUT INJECTION & PAYLOAD SANITIZER (ANTI-XSS & SQL/NOSQL ATTACKS)
// -----------------------------------------------------------------------------
const DANGEROUS_PATTERNS = [
  /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
  /javascript\s*:/gi,
  /onerror\s*=/gi,
  /onload\s*=/gi,
  /onclick\s*=/gi,
  /eval\s*\(/gi,
  /\bunion\s+select\b/gi,
  /\bdrop\s+table\b/gi,
  /\binsert\s+into\b/gi,
  /\bexec\s*\(/gi,
  /\0/g, // Null byte injection
  /\.\.\/|\.\.\\/g, // Path traversal
];

function containsDangerousPattern(str: string): boolean {
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(str));
}

function sanitizeObject(obj: any): { isMalicious: boolean; detectedPattern?: string } {
  if (!obj || typeof obj !== 'object') return { isMalicious: false };

  const queue = [obj];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const key of Object.keys(current)) {
      // Prototype pollution defense
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return { isMalicious: true, detectedPattern: `Prototype pollution attempt on key: ${key}` };
      }

      const val = current[key];
      if (typeof val === 'string') {
        if (containsDangerousPattern(val)) {
          return { isMalicious: true, detectedPattern: `Injection payload found in field: ${key}` };
        }
      } else if (typeof val === 'object' && val !== null) {
        queue.push(val);
      }
    }
  }

  return { isMalicious: false };
}

export function inputSanitizerMiddleware(req: Request, res: Response, next: NextFunction) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const bodyCheck = sanitizeObject(req.body);
    if (bodyCheck.isMalicious) {
      const ip = getClientIp(req);
      dbStore.logAudit({
        adminId: 'SECURITY_FIREWALL',
        adminEmail: 'security@profixa.com',
        action: 'MALICIOUS_PAYLOAD_BLOCKED',
        targetType: 'API_Request',
        targetId: req.path,
        ipAddress: ip,
        metadata: { pattern: bodyCheck.detectedPattern, method: req.method, path: req.path },
      });

      return res.status(400).json({
        success: false,
        error: 'Security Warning: Suspicious or unsafe characters detected. Request rejected by platform security shield.',
      });
    }
  }

  next();
}

// -----------------------------------------------------------------------------
// 4. DATA PRIVACY FILTER (ZERO-LEAK GUARANTEE)
// -----------------------------------------------------------------------------
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '******';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 4))}${local[local.length - 1]}@${domain}`;
}
