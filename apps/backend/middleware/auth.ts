import jwt from 'jsonwebtoken';

// FIXED: Throw at startup if JWT_SECRET is missing — no insecure fallback
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable is required. ' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
  );
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts[0].trim();
    if (name) {
      list[name] = decodeURIComponent((parts[1] || '').trim());
    }
  });
  return list;
}

export function authMiddleware(req: any, res: any, next: any) {
  try {
    const cookies = parseCookies(req.headers.cookie);
    let token = cookies['token'];

    if (!token && req.headers.authorization) {
      if (req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'Access denied. Please log in.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET!) as any;
    req.user = decoded; // { id, username, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please login again.' });
  }
}

export function adminMiddleware(req: any, res: any, next: any) {
  authMiddleware(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ error: 'Forbidden. Admin access required.' });
    }
  });
}
