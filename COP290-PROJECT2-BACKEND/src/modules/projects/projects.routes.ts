import {Router} from 'express';
import {Authenticate} from '../../core/middleware/auth';
import {
  createProject,
  fetchProjects,
  fetchProjectById,
  fetchMainBoard,
  patchProject,
  archiveProject,
  fetchMembers,
  addMember,
  patchMemberRole,
  removeMember,
  deleteProject,
} from './projects.controller';

const router = Router();

//The below endpoint allows us to create a project.
router.post('', Authenticate, createProject);

//The below endpoint allows us to fetch all projects for a user.
router.get('', Authenticate, fetchProjects);

//The below endpoint allows us to fetch a project by id.
router.get('/:id', Authenticate, fetchProjectById);

//The below endpoint allows us to fetch the main board for a project.
router.get('/:id/boards/main', Authenticate, fetchMainBoard);

//The below endpoint allows us to update a project.
router.patch('/:id', Authenticate, patchProject);

//The below endpoint allows us to archive a project.
router.patch('/:id/archive', Authenticate, archiveProject);

//The below endpoint allows us to fetch members of a project.
router.get('/:id/members', Authenticate, fetchMembers);

//The below endpoint allows us to add a member to a project.
router.post('/:id/members', Authenticate, addMember);

//The below endpoint allows us to update a member's role in a project.
router.patch('/:id/members/:userId', Authenticate, patchMemberRole);

//The below endpoint allows us to remove a member from a project.
router.delete('/:id/members/:userId', Authenticate, removeMember);

//Below endpoint allows us to delete a project.
router.delete('/:id', Authenticate, deleteProject);

export const projectRouter = router;
