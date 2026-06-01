import {prisma} from '../../core/database/db';
import {ProjectRole, GlobalRole} from '@prisma/client';
import {checkrole, isGlobalAdmin} from '../../core/middleware/utils';

const REQUIRED_DEFAULT_COLUMNS = [
  {
    name: 'TODO',
    scope: 'STORY',
    columnType: 'TODO',
    isImmutable: true,
    position: 1000,
  },
  {
    name: 'IN PROGRESS',
    scope: 'STORY',
    columnType: 'INPROGRESS',
    isImmutable: true,
    position: 2000,
  },
  {
    name: 'REVIEW',
    scope: 'STORY',
    columnType: 'REVIEW',
    isImmutable: true,
    position: 3000,
  },
  {
    name: 'DONE',
    scope: 'STORY',
    columnType: 'DONE',
    isImmutable: true,
    position: 4000,
  },
  {
    name: 'TODO',
    scope: 'TASKBUG',
    columnType: 'TODO',
    isImmutable: false,
    position: 11000,
  },
  {
    name: 'IN PROGRESS',
    scope: 'TASKBUG',
    columnType: 'INPROGRESS',
    isImmutable: false,
    position: 12000,
  },
  {
    name: 'REVIEW',
    scope: 'TASKBUG',
    columnType: 'REVIEW',
    isImmutable: false,
    position: 13000,
  },
  {
    name: 'DONE',
    scope: 'TASKBUG',
    columnType: 'DONE',
    isImmutable: false,
    position: 14000,
  },
] as const;

const buildDefaultColumns = (boardId: string) =>
  REQUIRED_DEFAULT_COLUMNS.map((column) => ({
    ...column,
    boardId,
    limit: null,
  }));

export const createProject = async (
  userId: string,
  name: string,
  description,
  colour,
) => {
  const globalAdmin = await isGlobalAdmin(userId);
  if (!globalAdmin) throw new Error('ERROR_69');
  if (!name) throw new Error('ERROR_59');
  if (!colour) colour = '#ff00c3';
  if (!description) description = '';
  return prisma.project.create({
    data: {
      name: name,
      description: description,
      colour: colour,
      members: {
        create: {
          userId: userId,
          role: 'ADMIN',
        },
      },
    },
  });
};

export const fetchProjects = async (userId: string) => {
  const user = await prisma.user.findUnique({where: {id: userId}});
  if (!user) throw new Error('ERROR_56');
  if (user.role === GlobalRole.ADMIN) {
    //Return all projects for global admin, along with how many tasks are there in each project.
    const projects = await prisma.project.findMany({
      include: {members: true, _count: {select: {issues: true}}},
    });
    return projects.map((p) => ({
      ...p,
      tasks: p._count.issues,
    }));
  }
  const projects = await prisma.project.findMany({
    where: {members: {some: {userId: userId}}},
    include: {members: true, _count: {select: {issues: true}}},
  });
  //return each project along with a new task field.
  return projects.map((p) => ({
    ...p,
    tasks: p._count.issues,
  }));
};

export const fetchProjectById = async (projectId: string, userId: string) => {
  const project = await prisma.project.findUnique({
    where: {id: projectId},
  });
  //throw error if no such project.
  if (!project) throw new Error('ERROR_45');
  //Design decision: All project members and global admins can view project details.
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
  return project;
};

export const fetchMainBoard = async (projectId: string, userId: string) => {
  const project = await prisma.project.findUnique({
    where: {id: projectId},
    include: {members: true},
  });
  //throw error if no such project.
  if (!project) throw new Error('ERROR_45');
  //Design decision: All project members and global admins can view the main board.
  const globalAdmin = await isGlobalAdmin(userId);
  if (
    (await checkrole(userId, projectId, [
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
      ProjectRole.VIEWER,
    ])) == false &&
    !globalAdmin
  ) {
    throw new Error('ERROR_46');
  }
  //Return the first board for the project as-is.
  const existingBoard = await prisma.board.findFirst({
    where: {projectId},
    orderBy: {id: 'asc'},
  });

  if (existingBoard) {
    return prisma.board.findUnique({
      where: {id: existingBoard.id},
      include: {columns: {include: {issues: true}, orderBy: {position: 'asc'}}},
    });
  }

  // If no boards exist, create the main board and initialize required default columns once.
  const createdBoard = await prisma.board.create({
    data: {
      name: 'Main Board',
      projectId,
      description: 'Default board',
    },
  });

  await prisma.column.createMany({
    data: buildDefaultColumns(createdBoard.id),
  });
  const board = createdBoard;
  return prisma.board.findUnique({
    where: {id: board.id},
    include: {columns: {include: {issues: true}, orderBy: {position: 'asc'}}},
  });
};

export const patchProject = async (
  projectId: string,
  userId: string,
  name,
  description,
  colour,
) => {
  const project = await prisma.project.findUnique({
    where: {id: projectId},
    include: {members: true},
  });
  //throw error if no such project.
  if (!project) throw new Error('ERROR_45');
  //throw error if no fields to update.
  if (!name && !description && !colour) throw new Error('ERROR_57');
  //Design decision: Only admins and global admins can edit project details.
  if (
    (await checkrole(userId, projectId, [ProjectRole.ADMIN])) == false &&
    !(await isGlobalAdmin(userId))
  )
    throw new Error('ERROR_47');
  //create the updated project object
  const updatedProject = project;
  if (name) updatedProject.name = name;
  if (description) updatedProject.description = description;
  if (colour) updatedProject.colour = colour;
  await prisma.project.update({
    where: {id: projectId},
    data: {
      name: updatedProject.name,
      description: updatedProject.description,
      colour: updatedProject.colour,
    },
  });
  return updatedProject;
};

export const archiveProject = async (
  projectId: string,
  userId: string,
  isArchived: boolean,
) => {
  const project = await prisma.project.findUnique({
    where: {id: projectId},
    include: {members: true},
  });
  //throw error if no such project.
  if (!project) throw new Error('ERROR_45');
  //Design decision: Only admins and global admins can archive/unarchive projects.
  if (
    (await checkrole(userId, projectId, [ProjectRole.ADMIN])) == false &&
    !(await isGlobalAdmin(userId))
  )
    throw new Error('ERROR_48');
  await prisma.project.update({
    where: {id: projectId},
    data: {isArchived: isArchived ?? false}, //default to false , if null
  });
  return {ok: true};
};

export const deleteProject = async (projectId: string, requesterId: string) => {
  const project = await prisma.project.findUnique({
    where: {id: projectId},
    include: {members: true},
  });
  //throw error if no such project
  if (!project) throw new Error('ERROR_45');
  //Design decision: Only admins and global admins can delete the project.
  if (
    (await checkrole(requesterId, projectId, [ProjectRole.ADMIN])) == false &&
    !(await isGlobalAdmin(requesterId))
  )
    throw new Error('ERROR_53');
  await prisma.project.delete({
    where: {id: projectId},
  });
  return {ok: true};
};
