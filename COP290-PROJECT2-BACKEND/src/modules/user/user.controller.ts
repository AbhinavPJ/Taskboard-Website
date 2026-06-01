import * as UserService from './user.service';
import { handleError } from '../../core/middleware/errorhandler';

//Given a user id, fetch the user's details.
export const getMe = async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await UserService.getMe(req.userId);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given updated user details, patch the user's details.
export const patchMe = async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const { name, email, avatar } = req.body;
    if (name === undefined && email === undefined && avatar === undefined)
      return res.status(400).json({ error: 'No fields to update' });
    const result = await UserService.patchMe(req.userId, name, email, avatar);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given a user id and avatar, update the user's avatar.
export const postAvatar = async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ error: 'Avatar is required' });
    const result = await UserService.postAvatar(req.userId, avatar);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

export const getAllUsers = async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await UserService.getAllUsers(req.userId);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

export const toggleUserRole = async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.params.id;
    const result = await UserService.toggleUserRole(req.userId, userId);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};
