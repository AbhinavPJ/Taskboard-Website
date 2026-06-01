import {prisma} from '../../core/database/db';
import {ProjectRole, GlobalRole} from '@prisma/client';
import {checkrole, isGlobalAdmin} from '../../core/middleware/utils';

export const fetchMembers = async (userId: string, projectId: string) => {
  //Only project members and global admins can fetch project members.
  const globalAdmin = await isGlobalAdmin(userId);
  if (
    (await checkrole(userId, projectId, [
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
      ProjectRole.VIEWER,
    ])) == false &&
    !globalAdmin
  )
    throw new Error('ERROR_44');
  //Fetch the project along with members to check permissions and return members.
  const project = await prisma.project.findUnique({
    where: {id: projectId},
    include: {members: {include: {user: true}}},
  });
  if (!project) throw new Error('ERROR_45');
  return project.members;
};

export const addMember = async (
  projectId: string,
  requesterId: string,
  email: string,
  role,
) => {
  const loweremail = email.toLowerCase();
  const upperRole = role.toUpperCase();
  const project = await prisma.project.findUnique({
    where: {id: projectId},
    include: {members: true},
  });
  //check if email exists, if not throw error.
  const user = await prisma.user.findUnique({where: {email: loweremail}});
  if (!user) throw new Error('ERROR_49');
  //check if project exists, if not throw error.
  if (!project) throw new Error('ERROR_45');
  //Design decision: Only admins and global admins can add members to the project.
  if (
    (await checkrole(requesterId, projectId, [ProjectRole.ADMIN])) == false &&
    !(await isGlobalAdmin(requesterId))
  )
    throw new Error('ERROR_50');
  //check if user is already a member of the project, if yes throw error.
  for (const member of project.members)
    if (member.userId == user.id) throw new Error('ERROR_51');
  return prisma.projectMember.create({
    data: {
      userId: user.id,
      projectId: projectId,
      role: upperRole,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
};

export const patchMemberRole = async (
  projectId: string,
  requesterId: string,
  targetUserId: string,
  role,
) => {
  const project = await prisma.project.findUnique({
    where: {id: projectId},
    include: {members: true},
  });
  //throw error if no such project
  if (!project) throw new Error('ERROR_45');
  //Design decision: Only admins and global admins can change member roles.
  if (
    (await checkrole(requesterId, projectId, [ProjectRole.ADMIN])) == false &&
    !(await isGlobalAdmin(requesterId))
  )
    throw new Error('ERROR_52');
  //a_b: composite unique key in projectMember table.
  return prisma.projectMember.update({
    where: {
      userId_projectId: {projectId: projectId, userId: targetUserId},
    },
    data: {role},
  });
};

export const removeMember = async (
  projectId: string,
  requesterId: string,
  targetUserId: string,
) => {
  const project = await prisma.project.findUnique({
    where: {id: projectId},
    include: {members: true},
  });
  //throw error if no such project
  if (!project) throw new Error('ERROR_45');
  //Design decision: Users cannot remove themselves from the project.
  if (requesterId === targetUserId) throw new Error('ERROR_56');
  if (
    (await checkrole(requesterId, projectId, [ProjectRole.ADMIN])) == false &&
    !(await isGlobalAdmin(requesterId))
  )
    throw new Error('ERROR_54');
  await prisma.projectMember.delete({
    where: {
      userId_projectId: {
        projectId: projectId,
        userId: targetUserId,
      },
    },
  });
  return {ok: true};
};
