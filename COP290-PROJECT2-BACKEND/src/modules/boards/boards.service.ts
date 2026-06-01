import { prisma } from '../../core/database/db';
import { ProjectRole, ColumnType } from '@prisma/client';
import { checkrole, isGlobalAdmin } from '../../core/middleware/utils';
import { resetAdjacencyMatrix } from '../columns/columns.utils';
export const fetchBoardsForProject = async (
  projectId: string,
  userId: string,
) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });
  if (!project) throw new Error('ERROR_1');
  // Detect if user is trying to access project that they are not a part of, if they are not global admin.
  const isMember = project.members.some((m) => m.userId === userId);
  const globalAdmin = await isGlobalAdmin(userId);
  if (!isMember && !globalAdmin) throw new Error('ERROR_2');
  const boards = await prisma.board.findMany({
    where: { projectId },
    //ensure that columns are sorted by position.
    include: {
      columns: { orderBy: { position: 'asc' } },
      workflowTransition: true,
    },
    orderBy: { name: 'asc' },
  });
  return boards;
};

export const createBoard = async (
  projectId: string,
  userId: string,
  name: string,
  description?: string,
  resolvedColumnType?: string,
  closedColumnType?: string,
) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });
  //Throw error if project doesn't exist
  if (!project) throw new Error('ERROR_3');
  //Design decision: Only admins and global admins can create boards.
  if (
    (await checkrole(userId, project.id, [ProjectRole.ADMIN])) === false &&
    !(await isGlobalAdmin(userId!))
  )
    throw new Error('ERROR_4');
  const board = await prisma.board.create({
    data: {
      name,
      projectId,
      description: description || '',
      resolvedColumnType: resolvedColumnType
        ? (resolvedColumnType.toUpperCase() as ColumnType)
        : ColumnType.REVIEW,
      closedColumnType: closedColumnType
        ? (closedColumnType.toUpperCase() as ColumnType)
        : ColumnType.DONE,
    },
  });
  // Create default columns for the new board
  //Cute way of handling two rows: everything <10k is for story, >10k is for task/bug.
  //This works because there are always exactly 4 columns for story.
  await prisma.column.createMany({
    data: [
      {
        boardId: board.id,
        name: 'TODO',
        columnType: 'TODO',
        scope: 'STORY',
        isImmutable: true,
        position: 1000,
      },
      {
        boardId: board.id,
        name: 'IN PROGRESS',
        columnType: 'INPROGRESS',
        scope: 'STORY',
        isImmutable: true,
        position: 2000,
      },
      {
        boardId: board.id,
        name: 'REVIEW',
        columnType: 'REVIEW',
        scope: 'STORY',
        isImmutable: true,
        position: 3000,
      },
      {
        boardId: board.id,
        name: 'DONE',
        columnType: 'DONE',
        scope: 'STORY',
        isImmutable: true,
        position: 4000,
      },
      {
        boardId: board.id,
        name: 'TODO',
        columnType: 'TODO',
        scope: 'TASKBUG',
        isImmutable: false,
        position: 11000,
      },
      {
        boardId: board.id,
        name: 'IN PROGRESS',
        columnType: 'INPROGRESS',
        scope: 'TASKBUG',
        isImmutable: false,
        position: 12000,
      },
      {
        boardId: board.id,
        name: 'REVIEW',
        columnType: 'REVIEW',
        scope: 'TASKBUG',
        isImmutable: false,
        position: 13000,
      },
      {
        boardId: board.id,
        name: 'DONE',
        columnType: 'DONE',
        scope: 'TASKBUG',
        isImmutable: false,
        position: 14000,
      },
    ],
  });
  await resetAdjacencyMatrix(board.id);
  // Fetch the board with columns to return
  const createdBoard = await prisma.board.findUnique({
    where: { id: board.id },
    //ensure that columns are sorted by position.
    include: {
      columns: { orderBy: { position: 'asc' } },
      workflowTransition: true,
    },
  });
  return createdBoard;
};

export const fetchBoardById = async (boardId: string, userId: string) => {
  let board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      project: true,
      columns: {
        include: {
          issues: {
            include: { project: true, assignee: true, children: true },
          },
        },
        orderBy: { position: 'asc' },
      },
      workflowTransition: true,
    },
  });
  //Throw error if board doesn't exist
  if (!board) throw new Error('ERROR_5');
  //Throw error if board's project doesn't exist
  if (!board.project) throw new Error('ERROR_3');
  const globalAdmin = await isGlobalAdmin(userId);
  //Throw error if user is not a member of the project and not a global admin.
  if (
    !globalAdmin &&
    (await checkrole(userId, board.project.id, [
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
      ProjectRole.VIEWER,
    ])) === false
  )
    throw new Error('ERROR_2');
  return board;
};
export const patchBoard = async (
  boardId: string,
  userId: string,
  name?: string,
  description?: string,
  resolvedColumnType?: string,
  closedColumnType?: string,
) => {
  //Fetch the board, we can't directly update because we need to check permissions.
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: { project: { include: { members: true } } },
  });
  //Throw error if board doesn't exist
  if (!board) throw new Error('ERROR_6');
  //Throw error if board's project doesn't exist
  if (!board.project) throw new Error('ERROR_3');
  //Throw error if user is not an admin of the project and not a global admin.
  if (
    (await checkrole(userId, board.project.id, [ProjectRole.ADMIN])) ===
      false &&
    !(await isGlobalAdmin(userId!))
  )
    throw new Error('ERROR_7');
  const updatedData: {
    name?: string;
    description?: string;
    resolvedColumnType?: ColumnType;
    closedColumnType?: ColumnType;
  } = {};
  if (name) updatedData.name = name;
  if (description) updatedData.description = description;
  if (resolvedColumnType)
    updatedData.resolvedColumnType =
      resolvedColumnType.toUpperCase() as ColumnType;
  if (closedColumnType)
    updatedData.closedColumnType = closedColumnType.toUpperCase() as ColumnType;
  const updatedBoard = await prisma.board.update({
    where: { id: board.id },
    data: updatedData,
  });
  return updatedBoard;
};

export const addColumnToBoard = async (
  boardId: string,
  userId: string,
  name: string,
  columnType: string,
  position?: number,
  limit?: number,
) => {
  //Check if board exists and fetch its project to check permissions.
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: { project: { include: { members: true } } },
  });
  //Throw error if board doesn't exist
  if (!board) throw new Error('ERROR_8');
  const project = board.project;
  //Throw error if project doesn't exist
  if (!project) throw new Error('ERROR_3');
  //Throw error if board's project doesn't exist
  if (!board.project) throw new Error('ERROR_3');
  //Design decision: Only admins and global admins can create columns.
  if (
    (await checkrole(userId, project.id, [ProjectRole.ADMIN])) === false &&
    !(await isGlobalAdmin(userId!))
  )
    throw new Error('ERROR_9');
  const existingColumn = await prisma.column.findFirst({
    where: {
      boardId,
      scope: 'TASKBUG',
      name,
    },
  });
  if (existingColumn) throw new Error('ERROR_68');
  //By default, we set position of column to be at the end.
  let pos = position;
  if (pos === undefined || pos === null) {
    const columnCount = await prisma.column.count({
      where: { boardId, scope: 'TASKBUG' },
    });
    pos = (columnCount + 11) * 1000;
  } //Extra 11 is to send to second row!
  //Return the created column.
  const column = await prisma.column.create({
    data: {
      boardId: boardId,
      name: name,
      columnType: columnType.toUpperCase(),
      scope: 'TASKBUG',
      isImmutable: false,
      limit: limit ?? null,
      position: pos,
    },
  });
  await resetAdjacencyMatrix(boardId);
  return column;
};

export const deleteBoard = async (boardId: string, userId: string) => {
  //Check if board exists and fetch its project to check permissions.
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: { project: { include: { members: true } } },
  });
  //Throw error if board doesn't exist
  if (!board) throw new Error('ERROR_10');
  //Throw error if board's project doesn't exist
  if (!board.project) throw new Error('ERROR_3');
  //Design decision: Only admins and global admins can delete boards.
  if (
    (await checkrole(userId, board.project.id, [ProjectRole.ADMIN])) ===
      false &&
    !(await isGlobalAdmin(userId!))
  )
    throw new Error('ERROR_11');
  await prisma.board.delete({ where: { id: board.id } });
  return { ok: true };
};

export const fetchWorkflow = async (boardId: string, userId: string) => {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: { project: { include: { members: true } } },
  });
  if (!board) throw new Error('ERROR_5');
  if (!board.project) throw new Error('ERROR_3');

  const globalAdmin = await isGlobalAdmin(userId);
  if (
    !globalAdmin &&
    (await checkrole(userId, board.project.id, [
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
      ProjectRole.VIEWER,
    ])) === false
  )
    throw new Error('ERROR_46');

  let workflowTransition = await prisma.workflowTransition.findUnique({
    where: { boardId },
  });

  const taskbugColumns = await prisma.column.findMany({
    where: { boardId, scope: 'TASKBUG' },
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
    select: { id: true },
  });
  const taskbugColumnIds = taskbugColumns.map((c) => c.id);
  const sortedSavedIds = Array.isArray(workflowTransition?.columnIds)
    ? workflowTransition.columnIds.map(String).sort()
    : [];
  const sortedCurrentIds = [...taskbugColumnIds].sort();
  const isOutOfSync =
    !workflowTransition ||
    JSON.stringify(sortedSavedIds) !== JSON.stringify(sortedCurrentIds);

  //Adjacency matrix where columns[i]->columns[j] is represented by
  // adjacencyMatrix[i][j], 1 means allowed, 0 means blocked.
  if (isOutOfSync) {
    workflowTransition = await resetAdjacencyMatrix(boardId);
  }
  const columnIds = workflowTransition.columnIds.map((id) => String(id));
  const adjacencyMatrix = workflowTransition.adjacencyMatrix as number[][];
  const workflow: Array<{ sourceColumnId: string; targetColumnId: string }> =
    [];
  //above is list of blocked transitions, we need to do adj. matrix->adj. list
  for (let i = 0; i < columnIds.length; i++) {
    for (let j = 0; j < columnIds.length; j++) {
      const blocked =
        Array.isArray(adjacencyMatrix[i]) &&
        Number((adjacencyMatrix[i] as number[])[j]) !== 1;
      if (blocked) {
        workflow.push({
          sourceColumnId: columnIds[i],
          targetColumnId: columnIds[j],
        });
      }
    }
  }
  return {
    boardId,
    workflow,
  };
};

export const patchWorkflow = async (
  boardId: string,
  userId: string,
  workflow: Array<{ sourceColumnId: string; targetColumnId: string }>,
) => {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: { project: { include: { members: true } } },
  });
  if (!board) throw new Error('ERROR_5');
  if (!board.project) throw new Error('ERROR_3');
  const globalAdmin = await isGlobalAdmin(userId);
  if (
    !globalAdmin &&
    (await checkrole(userId, board.project.id, [ProjectRole.ADMIN])) === false
  )
    throw new Error('ERROR_7');
  let workflowTransition = await prisma.workflowTransition.findUnique({
    where: { boardId },
  });

  const taskbugColumns = await prisma.column.findMany({
    where: { boardId, scope: 'TASKBUG' },
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
    select: { id: true },
  });
  const taskbugColumnIds = taskbugColumns.map((c) => c.id);
  const isOutOfSync =
    !workflowTransition ||
    JSON.stringify(
      Array.isArray(workflowTransition.columnIds)
        ? workflowTransition.columnIds.map((id) => String(id))
        : [],
    ) !== JSON.stringify(taskbugColumnIds);

  if (isOutOfSync) {
    workflowTransition = await resetAdjacencyMatrix(boardId);
  }
  const columnIds = Array.isArray(workflowTransition.columnIds)
    ? workflowTransition.columnIds.map((id) => String(id))
    : [];
  const adjacencyMatrix = Array.from({ length: columnIds.length }, () =>
    Array(columnIds.length).fill(1),
  ); //Initialize as all allowed
  const blockedPairs = workflow as Array<{
    sourceColumnId: string;
    targetColumnId: string;
  }>;
  for (const pair of blockedPairs) {
    const fromIndex = columnIds.indexOf(pair.sourceColumnId);
    const toIndex = columnIds.indexOf(pair.targetColumnId);
    if (fromIndex >= 0 && toIndex >= 0) {
      adjacencyMatrix[fromIndex][toIndex] = 0; //mark the blocked transitions.
    }
  }
  await prisma.workflowTransition.update({
    where: { boardId },
    data: {
      columnIds,
      adjacencyMatrix,
    },
  });
  return {
    boardId,
    workflow: blockedPairs,
  };
};
