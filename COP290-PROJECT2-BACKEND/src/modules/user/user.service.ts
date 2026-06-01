import {prisma} from '../../core/database/db';

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {id: userId},
  });
  //Throw error if user doesn't exist
  if (!user) throw new Error('ERROR_56');
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  };
};

export const patchMe = async (userId: string, name?, email?, avatar?) => {
  const user = await prisma.user.findUnique({
    where: {id: userId},
  });
  //Throw error if user doesn't exist
  if (!user) throw new Error('ERROR_56');
  const updatedUser = user;
  if (name) updatedUser.name = name;
  if (email) updatedUser.email = email;
  if (avatar) updatedUser.avatar = avatar;
  //Update the table with new detail.
  const result = await prisma.user.update({
    where: {id: userId},
    data: {
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
    },
  });
  return {
    id: result.id,
    name: result.name,
    username: result.username,
    email: result.email,
    role: result.role,
    avatar: result.avatar,
  };
};

export const postAvatar = async (userId: string, avatar) => {
  if (!avatar) throw new Error('ERROR_57');
  const user = await prisma.user.findUnique({
    where: {id: userId},
  });
  //Throw error if user doesn't exist
  if (!user) throw new Error('ERROR_56');
  const updatedUser = await prisma.user.update({
    where: {id: userId},
    data: {
      avatar,
    },
  });
  return {
    id: updatedUser.id,
    name: updatedUser.name,
    username: updatedUser.username,
    email: updatedUser.email,
    role: updatedUser.role,
    avatar: updatedUser.avatar,
    ok: true,
  };
};

export const getAllUsers = async (requesterId: string) => {
  const requester = await prisma.user.findUnique({
    where: {id: requesterId},
    select: {role: true},
  });
  if (!requester) throw new Error('ERROR_56');
  if (requester.role !== 'ADMIN') throw new Error('ERROR_70');
  return prisma.user.findMany({
    orderBy: {username: 'asc'},
    select: {
      id: true,
      username: true,
      role: true,
    },
  });
};

export const toggleUserRole = async (
  requesterId: string,
  targetUserId: string,
) => {
  const requester = await prisma.user.findUnique({
    where: {id: requesterId},
    select: {role: true},
  });
  if (!requester) throw new Error('ERROR_56');
  if (requester.role !== 'ADMIN') throw new Error('ERROR_70');

  const target = await prisma.user.findUnique({
    where: {id: targetUserId},
    select: {id: true, role: true},
  });
  if (!target) throw new Error('ERROR_56');

  if (target.role === 'ADMIN') {
    const adminCount = await prisma.user.count({where: {role: 'ADMIN'}});
    if (adminCount <= 1) throw new Error('ERROR_71');
  }

  const nextRole = target.role === 'ADMIN' ? 'USER' : 'ADMIN';
  const updated = await prisma.user.update({
    where: {id: target.id},
    data: {role: nextRole},
    select: {
      id: true,
      username: true,
      role: true,
    },
  });

  return updated;
};
