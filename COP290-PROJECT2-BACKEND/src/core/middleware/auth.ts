import {Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import {AuthenticatedRequest} from '../../types/authRequest';
import {PASSKEY} from '../config/constants';

export const Authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  /*We create middleware to check if user is really logged in. It checks for the token in cookies,
  and matches it with the secret key. If valid, it adds userId to the request object for use in later routes.
   If not valid, it returns 401 Unauthorized.*/
  const cookie = req.headers.cookie;
  if (!cookie) return res.status(401).json({error: 'Unauthorized1'});
  if (req.cookies == undefined)
    return res.status(401).json({error: 'Unauthorized2'});
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({error: 'Unauthorized3'});
  try {
    const decoded = jwt.verify(token, PASSKEY) as {id: string};
    req.userId = decoded.id;
    next(); //This calls the next middleware/route handler. Without this, the request would never process.
    /*
    Important security design decision: We should not trust the client to send userId in the request body or headers, as that can be easily manipulated.
    Instead, we rely solely on the token for authentication and user identification. This way, even if someone tries to forge a request with a
    different userId in the body, it will be ignored.
   */
  } catch {
    res.status(401).json({error: 'Unauthorized4'});
  }
};
