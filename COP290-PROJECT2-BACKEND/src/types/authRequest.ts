import { Request } from "express";
export interface AuthenticatedRequest extends Request {
  userId?: string;
} //An authenticated request will have userId after passing through the Authenticate middleware
