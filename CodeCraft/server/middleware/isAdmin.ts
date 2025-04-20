import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if the current user is an admin
 * If the user is not an admin, returns a 403 Forbidden response
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Check if user is authenticated
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized, please log in' });
  }
  
  // Check if user has admin role
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  
  // If not admin, return forbidden
  return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
};