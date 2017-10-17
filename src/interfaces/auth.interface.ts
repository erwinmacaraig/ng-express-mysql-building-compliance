import { NextFunction, Request, Response } from 'express';

export interface AuthRequest extends Request {
  user?: any;
  token?: string;
}
