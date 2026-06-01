import * as ProjectService from './projects.service';
import * as ProjectMembersService from './members.service';
import { handleError } from '../../core/middleware/errorhandler';

//Given project details, create a new project.
export const createProject = async (req, res) => {
  try {
    const { name, description, colour } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = await ProjectService.createProject(
      req.userId,
      name,
      description,
      colour,
    );
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given a user id, fetch all projects the user is a member of.
export const fetchProjects = async (req, res) => {
  try {
    const result = await ProjectService.fetchProjects(req.userId);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given a project id, fetch project details along with its members and boards.
export const fetchProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Project id is required' });
    const result = await ProjectService.fetchProjectById(id, req.userId);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given a project id, fetch the main board of the project with its columns and issues.
export const fetchMainBoard = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Project id is required' });
    const result = await ProjectService.fetchMainBoard(id, req.userId);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given a project id and updated details, patch the project.
export const patchProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Project id is required' });
    const { name, description, colour } = req.body;
    if (name === undefined && description === undefined && colour === undefined)
      return res.status(400).json({ error: 'No fields to update' });
    const result = await ProjectService.patchProject(
      id,
      req.userId,
      name,
      description,
      colour,
    );
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given a project id and archive status, set its archived status.
export const archiveProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Project id is required' });
    const { isArchived } = req.body;
    if (isArchived === undefined)
      return res.status(400).json({ error: 'isArchived is required' });
    const result = await ProjectService.archiveProject(
      id,
      req.userId,
      isArchived,
    );
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given a project id, fetch all members of the project along with their roles.
export const fetchMembers = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Project id is required' });
    const result = await ProjectMembersService.fetchMembers(req.userId, id);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given a project id and user details, add the user as a member to the project.
export const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Project id is required' });
    const { email, userId, role } = req.body;
    if (!email && !userId)
      return res.status(400).json({ error: 'email or userId is required' });
    if (!role) return res.status(400).json({ error: 'Role is required' });
    const result = await ProjectMembersService.addMember(
      id,
      req.userId,
      email,
      role,
    );
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given a project id, user id and new role, update the role of the member in the project.
export const patchMemberRole = async (req, res) => {
  try {
    const { id, userId } = req.params;
    if (!id) return res.status(400).json({ error: 'Project id is required' });
    if (!userId) return res.status(400).json({ error: 'User id is required' });
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: 'Role is required' });
    const result = await ProjectMembersService.patchMemberRole(
      id,
      req.userId,
      userId,
      role,
    );
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given a project id and user id, remove the member from the project.
export const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    if (!id) return res.status(400).json({ error: 'Project id is required' });
    if (!userId) return res.status(400).json({ error: 'User id is required' });
    const result = await ProjectMembersService.removeMember(
      id,
      req.userId,
      userId,
    );
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given a project id, delete the project.
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Project id is required' });
    const result = await ProjectService.deleteProject(id, req.userId);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};
