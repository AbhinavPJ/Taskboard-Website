import {Router} from 'express';
import {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
} from './auth.controller';
import {Authenticate} from '../../core/middleware/auth';

const router = Router();

//The below endpoint is used to register a new user.
router.post('/register', registerUser);

//The below endpoint is used to login a user.
router.post('/login', loginUser);

//The purpose of this endpoint is to allow user to get a new token without having to login again, as long as they have a valid refresh token.
router.post('/refresh', refreshToken);

//The below endpoint is used to logout a user.
router.post('/logout', Authenticate, logoutUser);

export const authRouter = router; //google's style guide reccomends using name imports/exports instead of export default.
