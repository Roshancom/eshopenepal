import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import pool from '../config/db.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// FIXED: No insecure fallback — JWT_SECRET must be set in environment
const JWT_SECRET = process.env.JWT_SECRET!;

// FIXED: Cookie is secure in production, insecure only in explicit dev mode
function setCookieToken(res: any, token: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });
}

export async function register(req: any, res: any) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if ((existing as any[]).length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 'consumer']
    );

    const insertId = (result as any).insertId;
    const token = jwt.sign(
      { id: insertId, username, email, role: 'consumer' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    setCookieToken(res, token);

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: insertId, username, email, role: 'consumer' }
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Server error during registration' });
  }
}

export async function login(req: any, res: any) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, email]
    );
    const userList = users as any[];

    if (userList.length === 0) {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    const user = userList[0];
    const match = bcrypt.compareSync(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    setCookieToken(res, token);

    return res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login' });
  }
}

export async function registerAdmin(req: any, res: any) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if ((existing as any[]).length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 'admin']
    );

    const insertId = (result as any).insertId;
    const token = jwt.sign(
      { id: insertId, username, email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    setCookieToken(res, token);

    return res.status(201).json({
      message: 'Admin registration successful',
      token,
      user: { id: insertId, username, email, role: 'admin' }
    });
  } catch (err: any) {
    console.error('Admin register error:', err);
    return res.status(500).json({ error: 'Server error during admin registration' });
  }
}

export async function adminLogin(req: any, res: any) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    const [users] = await pool.query(
      'SELECT * FROM users WHERE (email = ? OR username = ?) AND role = "admin"',
      [email, email]
    );
    const userList = users as any[];

    if (userList.length === 0) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const user = userList[0];
    const match = bcrypt.compareSync(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    setCookieToken(res, token);

    return res.json({
      message: 'Admin login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: 'admin' }
    });
  } catch (err: any) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'Server error during admin login' });
  }
}

export async function googleLogin(req: any, res: any) {
  try {
    const { token, role } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Google token is required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    const { email, name, picture, sub: googleId } = payload;
    const userRole = role === 'admin' ? 'admin' : 'consumer';
    const fullName = name || '';
    const profilePicture = picture || '';

    // Check if user exists (by email or google_id)
    const [existing] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR google_id = ?',
      [email, googleId]
    );
    const userList = existing as any[];

    let userId: number;
    let username: string;
    let finalRole: string;

    if (userList.length > 0) {
      // User exists - login
      userId = userList[0].id;
      username = userList[0].username;
      finalRole = userList[0].role;

      // Update Google-specific fields if they changed
      await pool.query(
        `UPDATE users SET google_id = ?, full_name = ?, profile_picture_url = ?,
         auth_provider = CASE WHEN auth_provider IS NULL OR auth_provider = 'email' THEN 'google' ELSE auth_provider END
         WHERE id = ?`,
        [googleId, fullName, profilePicture, userId]
      );
    } else {
      // New user - register with Google data
      const generatedUsername = name?.replace(/\s+/g, '_').toLowerCase() || email.split('@')[0];
      const hashedPassword = bcrypt.hashSync(Math.random().toString(36), 10);

      const [result] = await pool.query(
        `INSERT INTO users (username, email, password, role, google_id, full_name, profile_picture_url, auth_provider)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'google')`,
        [generatedUsername, email, hashedPassword, userRole, googleId, fullName, profilePicture]
      );
      userId = (result as any).insertId;
      username = generatedUsername;
      finalRole = userRole;
    }

    const sessionToken = jwt.sign(
      { id: userId, username, email, role: finalRole },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    setCookieToken(res, sessionToken);

    return res.json({
      message: 'Google login successful',
      token: sessionToken,
      user: {
        id: userId,
        username,
        email,
        role: finalRole,
        full_name: fullName,
        profile_picture_url: profilePicture,
        auth_provider: 'google',
      }
    });
  } catch (err: any) {
    console.error('Google login error:', err);
    return res.status(500).json({ error: 'Server error during Google login' });
  }
}

export function getCurrentUser(req: any, res: any) {
  return res.json({ user: req.user });
}

export function logout(req: any, res: any) {
  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully' });
}
