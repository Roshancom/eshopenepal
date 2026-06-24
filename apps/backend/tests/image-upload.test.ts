import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs';
import express from 'express';
import multer from 'multer';
import { Request, Response } from 'express';
import supertest from 'supertest';
import { resolveBackendDir, toAbsoluteImageUrl, normalizeImageUrls } from '../src/utils/paths.js';

// ─────────────────────────────────────────────────────────────────────────────
// Paths Utility Unit Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('resolveBackendDir', () => {
  it('returns an absolute path containing uploads', () => {
    const result = resolveBackendDir('uploads');
    expect(path.isAbsolute(result)).toBe(true);
    expect(result).toContain('uploads');
  });

  it('returns a path with apps/backend/ prefix when running from monorepo root', () => {
    const result = resolveBackendDir('uploads');
    // When running from the repo root (which contains apps/backend/), the path
    // includes apps/backend/ before the subpath
    expect(result).toContain('apps');
    expect(result).toContain('backend');
  });

  it('includes the subpath name in the resolved path', () => {
    const result = resolveBackendDir('test-dir');
    expect(result).toContain('test-dir');
  });
});

describe('toAbsoluteImageUrl', () => {
  it('converts relative /uploads/ path to absolute URL using the request host', () => {
    const req = { protocol: 'http', get: (name: string) => name === 'host' ? 'localhost:3001' : undefined };
    expect(toAbsoluteImageUrl(req as any, '/uploads/my-file.jpg'))
      .toBe('http://localhost:3001/uploads/my-file.jpg');
  });

  it('leaves already-absolute URLs unchanged', () => {
    const req = { protocol: 'http', get: () => 'localhost:3001' };
    expect(toAbsoluteImageUrl(req as any, 'https://images.example.com/photo.jpg'))
      .toBe('https://images.example.com/photo.jpg');
    expect(toAbsoluteImageUrl(req as any, 'http://my-cdn.com/img.png'))
      .toBe('http://my-cdn.com/img.png');
  });

  it('returns empty string for empty imageUrl', () => {
    const req = { protocol: 'http', get: () => 'localhost:3001' };
    expect(toAbsoluteImageUrl(req as any, '')).toBe('');
  });

  it('falls back to localhost:3001 when host header is missing', () => {
    const req = { protocol: 'https', get: () => undefined };
    expect(toAbsoluteImageUrl(req as any, '/uploads/test.jpg'))
      .toBe('https://localhost:3001/uploads/test.jpg');
  });

  it('uses https when request protocol is https', () => {
    const req = { protocol: 'https', get: (name: string) => name === 'host' ? 'api.example.com' : undefined };
    expect(toAbsoluteImageUrl(req as any, '/uploads/file.webp'))
      .toBe('https://api.example.com/uploads/file.webp');
  });
});

describe('normalizeImageUrls', () => {
  const req = { protocol: 'http', get: (name: string) => name === 'host' ? 'localhost:3001' : undefined };

  it('transforms image_url in a flat object', () => {
    const input = { id: 1, name: 'Test', image_url: '/uploads/file.jpg' };
    const result = normalizeImageUrls(req as any, input) as any;
    expect(result.image_url).toBe('http://localhost:3001/uploads/file.jpg');
    expect(result.id).toBe(1);
    expect(result.name).toBe('Test');
  });

  it('transforms image_url in an array of objects', () => {
    const input = [
      { id: 1, image_url: '/uploads/a.jpg' },
      { id: 2, image_url: '/uploads/b.jpg' },
    ];
    const result = normalizeImageUrls(req as any, input) as any[];
    expect(result[0].image_url).toBe('http://localhost:3001/uploads/a.jpg');
    expect(result[1].image_url).toBe('http://localhost:3001/uploads/b.jpg');
  });

  it('recursively transforms image_url in nested objects', () => {
    const input = {
      items: [
        { product: { image_url: '/uploads/deep.jpg' } },
      ],
    };
    const result = normalizeImageUrls(req as any, input) as any;
    expect(result.items[0].product.image_url).toBe('http://localhost:3001/uploads/deep.jpg');
  });

  it('leaves null/undefined body unchanged', () => {
    expect(normalizeImageUrls(req as any, null)).toBeNull();
    expect(normalizeImageUrls(req as any, undefined)).toBeUndefined();
  });

  it('leaves primitive bodies unchanged', () => {
    expect(normalizeImageUrls(req as any, 'hello')).toBe('hello');
    expect(normalizeImageUrls(req as any, 42)).toBe(42);
    expect(normalizeImageUrls(req as any, true)).toBe(true);
  });

  it('skips image_url values that are not strings', () => {
    const input = { image_url: 123 };
    const result = normalizeImageUrls(req as any, input) as any;
    expect(result.image_url).toBe(123);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Multer / Upload Integration Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Multer upload to correct directory', () => {
  let app: express.Express;
  let uploadsDir: string;

  // Track files created during tests for cleanup
  const createdFiles: string[] = [];

  beforeAll(() => {
    uploadsDir = resolveBackendDir('uploads');

    // Create a minimal test app with Multer configured exactly like productRoutes.ts
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadsDir),
      filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
      },
    });

    const upload = multer({
      storage,
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed (max 5MB)'));
        }
      },
    });

    // Multer error handler middleware (mirrors handleUploadError from productRoutes.ts)
    function handleUploadError(err: any, _req: Request, res: Response, next: Function) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ error: err.message });
      }
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    }

    // Echo route that returns uploaded file info
    app.post('/test-upload', upload.single('image'), handleUploadError, (req: Request, res: Response) => {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      res.json({
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: `/uploads/${req.file.filename}`,
      });
    });
  });

  afterEach(() => {
    // Clean up any files created during tests
    for (const file of createdFiles) {
      try {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      } catch { /* ignore */ }
    }
    createdFiles.length = 0;
  });

  it('saves an uploaded JPEG file to the correct directory', async () => {
    const res = await supertest(app)
      .post('/test-upload')
      .attach('image', Buffer.from('fake-jpeg-content'), 'test-image.jpg');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('filename');
    expect(res.body.mimetype).toBe('image/jpeg');
    expect(res.body.path).toMatch(/^\/uploads\/.+\.jpg$/);

    // Verify the file actually exists on disk in the uploads directory
    const savedFile = path.join(uploadsDir, res.body.filename);
    expect(fs.existsSync(savedFile)).toBe(true);

    // Verify the directory matches what app.ts uses (both use resolveBackendDir)
    const appUploadsDir = resolveBackendDir('uploads');
    expect(uploadsDir).toBe(appUploadsDir);

    // Track for cleanup
    createdFiles.push(savedFile);
  });

  it('rejects non-image files', async () => {
    const res = await supertest(app)
      .post('/test-upload')
      .attach('image', Buffer.from('not an image'), 'document.txt');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects files larger than 5MB', async () => {
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
    const res = await supertest(app)
      .post('/test-upload')
      .attach('image', largeBuffer, 'large.jpg');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when no file is uploaded', async () => {
    const res = await supertest(app)
      .post('/test-upload')
      .field('name', 'test');

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Normalization Middleware Integration Test
// ─────────────────────────────────────────────────────────────────────────────

describe('Normalization middleware (res.json override)', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();

    // Add the normalization middleware exactly like app.ts does
    app.use((req: Request, res: Response, next: Function) => {
      const origJson = res.json.bind(res);
      res.json = (body: unknown) => origJson(normalizeImageUrls(req, body));
      next();
    });

    // Test routes
    app.get('/test/products', (_req: Request, res: Response) => {
      res.json([
        { id: 1, name: 'Product A', image_url: '/uploads/a.jpg' },
        { id: 2, name: 'Product B', image_url: '/uploads/b.jpg' },
      ]);
    });

    app.get('/test/product/:id', (req: Request, res: Response) => {
      res.json({ id: Number(req.params.id), name: 'Product', image_url: '/uploads/single.jpg' });
    });

    app.get('/test/nested', (_req: Request, res: Response) => {
      res.json({
        items: [
          { product: { image_url: '/uploads/nested.jpg' } },
        ],
      });
    });

    app.get('/test/external', (_req: Request, res: Response) => {
      res.json({ image_url: 'https://cdn.example.com/image.jpg' });
    });

    app.get('/test/null', (_req: Request, res: Response) => {
      res.json(null);
    });
  });

  it('normalizes image_url in array responses to absolute URLs', async () => {
    const res = await supertest(app).get('/test/products');
    expect(res.status).toBe(200);
    expect(res.body[0].image_url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/uploads\/a\.jpg$/);
    expect(res.body[1].image_url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/uploads\/b\.jpg$/);
  });

  it('normalizes image_url in single object responses', async () => {
    const res = await supertest(app).get('/test/product/1');
    expect(res.status).toBe(200);
    expect(res.body.image_url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/uploads\/single\.jpg$/);
  });

  it('recursively normalizes image_url in nested objects', async () => {
    const res = await supertest(app).get('/test/nested');
    expect(res.status).toBe(200);
    expect(res.body.items[0].product.image_url).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/uploads\/nested\.jpg$/);
  });

  it('leaves already-absolute URLs unchanged', async () => {
    const res = await supertest(app).get('/test/external');
    expect(res.status).toBe(200);
    expect(res.body.image_url).toBe('https://cdn.example.com/image.jpg');
  });

  it('handles null response gracefully', async () => {
    const res = await supertest(app).get('/test/null');
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });
});
