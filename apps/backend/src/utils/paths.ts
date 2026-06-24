import path from 'path';
import fs from 'fs';
import type { Request } from 'express';

/**
 * Resolve a backend subdirectory path that works both from the monorepo root
 * (e.g., `pnpm dev:backend` via pnpm workspace) and from standalone deployment.
 *
 * - When CWD is the monorepo root → returns `<cwd>/apps/backend/<subpath>`
 * - When CWD is inside `apps/backend/` → returns `<cwd>/<subpath>`
 */
export function resolveBackendDir(subpath: string): string {
  const fromMonorepo = path.join(process.cwd(), 'apps', 'backend', subpath);
  if (fs.existsSync(path.join(process.cwd(), 'apps', 'backend'))) {
    return fromMonorepo;
  }
  return path.join(process.cwd(), subpath);
}

/**
 * Convert a relative image path (e.g. `/uploads/file.jpg`) to an absolute URL
 * using the incoming request. If the path is already absolute, returns it unchanged.
 */
export function toAbsoluteImageUrl(req: Pick<Request, 'protocol' | 'get'>, imageUrl: string): string {
  if (!imageUrl || imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  const host = req.get('host') || 'localhost:3001';
  const protocol = req.protocol || 'http';
  return `${protocol}://${host}${imageUrl}`;
}

/**
 * Recursively walk a response body and normalize any `image_url` string fields
 * from relative paths to absolute URLs using the incoming request.
 */
export function normalizeImageUrls(req: Pick<Request, 'protocol' | 'get'>, body: unknown): unknown {
  if (Array.isArray(body)) {
    return body.map(item => normalizeImageUrls(req, item));
  }
  if (body && typeof body === 'object') {
    const result: Record<string, unknown> = { ...(body as Record<string, unknown>) };
    if (typeof result.image_url === 'string') {
      result.image_url = toAbsoluteImageUrl(req, result.image_url);
    }
    for (const key of Object.keys(result)) {
      if (typeof result[key] === 'object' && result[key] !== null) {
        result[key] = normalizeImageUrls(req, result[key]);
      }
    }
    return result;
  }
  return body;
}
