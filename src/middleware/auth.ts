import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

/**
 * Extended Express Request with authenticated user information
 */
export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  username?: string;
  userRole?: string;
}

/**
 * Verifies JWT token from Authorization header and attaches user info to request
 * 
 * @example router.post('/discussions', authenticate, createDiscussion);
 * @throws {401} No token provided or invalid token
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { 
      id: string; 
      email: string; 
      username: string; 
      role: string;
    };
    
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    req.username = decoded.username;
    req.userRole = decoded.role;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Ensures user is registered (not Guest). Must be used after authenticate middleware.
 * 
 * @example router.post('/discussions', authenticate, requireRegisteredUser, createDiscussion);
 * @throws {403} Access denied for Guest users
 */
export function requireRegisteredUser(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userRole || req.userRole === 'Guest') {
    return res.status(403).json({ 
      error: 'Access denied. Only registered users can perform this action.' 
    });
  }
  
  next();
}
