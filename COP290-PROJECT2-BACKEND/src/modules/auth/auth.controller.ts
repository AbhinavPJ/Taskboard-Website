import { Request, Response } from 'express';
import * as AuthService from './auth.service';
import { handleError } from '../../core/middleware/errorhandler';

//given user details, register the user.
export const registerUser = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!username)
      return res.status(400).json({ error: 'Username is required' });
    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!password)
      return res.status(400).json({ error: 'Password is required' });
    const newUser = await AuthService.registerUser(
      name,
      username,
      email,
      password,
    );
    res.json(newUser);
  } catch (error) {
    handleError(res, error);
  }
};

//given email and password, login and create access and refresh tokens.
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!password)
      return res.status(400).json({ error: 'Password is required' });
    const { user, accessToken, refreshToken } = await AuthService.loginUser(
      email,
      password,
    );
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000, //1 hour
    }); //Access tokens are used for auth.
    // HttpOnly: We need a secure cookie (not accessible by client side scripts), maxAge: token expires in an hour.
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 3600000, //7 days
    });
    res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    });
  } catch (error) {
    handleError(res, error);
  }
};

//given a refresh token, issue a new access token.
export const refreshToken = async (req, res) => {
  try {
    //we require this function to issue a new access token, without logging in again.
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      return res.status(401).json({ error: 'Refresh token not found' });
    const newAccessToken = await AuthService.newAccessToken(refreshToken);
    if (!newAccessToken)
      return res.status(401).json({ error: 'Invalid refresh token' });
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      maxAge: 3600000,
    });
    res.json({ ok: true });
  } catch (error) {
    handleError(res, error);
  }
};

//given a refresh token, clear cookies, refreshtoken and logout
export const logoutUser = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      return res.status(400).json({ error: 'Refresh token not found' });
    res.clearCookie('accessToken'); //we clear access&refresh token from cookies on logout.
    res.clearCookie('refreshToken');
    await AuthService.logoutUser(req.userId); //perform server side logout
    res.json({ ok: true });
  } catch (error) {
    handleError(res, error);
  }
};
