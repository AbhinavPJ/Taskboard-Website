import {ProjectRole, GlobalRole} from '@prisma/client';
import {prisma} from '../database/db';

/*
Below is a utility function to check if a user's role is among the allowed roles.
Promise<boolean> is the same as Future<bool> from dart.
*/
export const checkrole = async (
  userId: string,
  projectId: string,
  allowedRoles: ProjectRole[],
): Promise<boolean> => {
  const member = await prisma.projectMember.findUnique({
    where: {userId_projectId: {userId, projectId}},
    select: {role: true},
  }); //userId_projectId is a compound unique key, We fetch only the role field(minimizes data transfer).
  if (!member) return false;
  return allowedRoles.includes(member.role);
};

// Check if a user is a Global Admin (bypass all project-level permissions)
export const isGlobalAdmin = async (userId: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({where: {id: userId}});
  if (!user) return false;
  return user.role == 'ADMIN';
};
