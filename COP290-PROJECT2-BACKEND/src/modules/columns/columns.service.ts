import { prisma } from '../../core/database/db';
import { IssueType, ProjectRole } from '@prisma/client';
import { checkrole, isGlobalAdmin } from '../../core/middleware/utils';
import { deriveStoryStatus } from '../issues/issues.utils';
import { resetAdjacencyMatrix } from './columns.utils';

export const patchColumn = async (
  columnId: string,
  userId: string,
  name,
  position,
  limit,
  columnType,
) => {
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    include: {
      board: { include: { project: { include: { members: true } } } },
    },
  });
  //throw error if column not found.
  if (!column) throw new Error('ERROR_17');
  //throw error if no fields to update.
  if (
    name === undefined &&
    position === undefined &&
    limit === undefined &&
    columnType === undefined
  )
    throw new Error('ERROR_16');
  const project = column.board.project;
  const globalAdmin = await isGlobalAdmin(userId);
  //Design decision: Only admins and global admins can update column data like name, position and limit.
  if (
    !globalAdmin &&
    (await checkrole(userId, project.id, [ProjectRole.ADMIN])) == false
  )
    throw new Error('ERROR_18');
  if (column.isImmutable) throw new Error('ERROR_65');
  if (name !== undefined) {
    if (column.name !== name) {
      const existingColumn = await prisma.column.findFirst({
        where: {
          boardId: column.boardId,
          scope: column.scope,
          name: name,
          id: { not: columnId },
        },
      });
      if (existingColumn) throw new Error('ERROR_68');
      column.name = name;
      await resetAdjacencyMatrix(column.boardId);
    }
  }
  if (position !== undefined) column.position = position;
  if (limit !== undefined) column.limit = limit;
  if (columnType) column.columnType = (columnType as string).toUpperCase();
  const updatedColumn = await prisma.column.update({
    where: { id: columnId },
    data: {
      name: column.name,
      position: column.position,
      limit: column.limit,
      columnType: column.columnType,
    },
  });
  return {
    id: updatedColumn.id,
    boardId: updatedColumn.boardId,
    name: updatedColumn.name,
    columnType: updatedColumn.columnType,
    position: updatedColumn.position,
    limit: updatedColumn.limit,
  };
};

export const deleteColumn = async (columnId: string, userId: string) => {
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    include: {
      board: { include: { project: { include: { members: true } } } },
    },
  });
  //throw error if column not found.
  if (!column) throw new Error('ERROR_19');
  const project = column.board.project;
  const globalAdmin = await isGlobalAdmin(userId);
  //Design decision: Only admins and global admins can delete columns.
  if (
    !globalAdmin &&
    (await checkrole(userId, project.id, [ProjectRole.ADMIN])) == false
  )
    throw new Error('ERROR_58');
  if (column.isImmutable) throw new Error('ERROR_62');
  await prisma.column.delete({
    where: { id: columnId },
  });
  await resetAdjacencyMatrix(column.boardId);
  return { ok: true };
};

export const createIssueInColumn = async (
  columnId: string,
  userId: string,
  title,
  description,
  type,
  priority,
  assigneeId,
  parentId,
  dueDate,
) => {
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    include: {
      issues: true,
      board: { include: { project: { include: { members: true } } } },
    },
  });
  //throw error if column not found.
  if (!column) throw new Error('ERROR_20');
  const project = column.board.project;
  //Design decision: Only admins, members and global admins can create issues.
  const globalAdmin = await isGlobalAdmin(userId);
  if (
    !globalAdmin &&
    (await checkrole(userId, project.id, [
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ])) == false
  )
    throw new Error('ERROR_21');
  //convert string to enum
  const issueType = (type as string).toUpperCase() as IssueType;
  let targetColumn = column;
  //There was a mismatch observed while creating stories, this is an elegant way to fix that mismatch
  //moreover, it is just an inexpensive safety net, so no worries.
  if (issueType === IssueType.STORY && column.scope !== 'STORY') {
    const storyColumn = await prisma.column.findFirst({
      where: {
        boardId: column.boardId,
        scope: 'STORY',
        columnType: column.columnType,
      },
    });
    if (!storyColumn) throw new Error('ERROR_63');
    targetColumn = storyColumn;
  }
  if (parentId) {
    const parentIssue = await prisma.issue.findUnique({
      where: { id: parentId },
      include: { column: true },
    });
    if (!parentIssue) throw new Error('ERROR_30');
    if (
      parentIssue.type !== IssueType.STORY ||
      issueType === IssueType.STORY ||
      parentIssue.projectId !== project.id ||
      parentIssue.column?.boardId !== targetColumn.boardId
    )
      throw new Error('ERROR_72');
  }
  if (targetColumn.limit !== null && targetColumn.limit !== undefined) {
    const currentCount = await prisma.issue.count({
      where: { columnId: targetColumn.id },
    });
    if (currentCount >= targetColumn.limit) {
      throw new Error('ERROR_74');
    }
  }
  //if assigneeId is provided, we need to send a notification to the assignee.
  const now = new Date();
  const resolvedColumnType = String(
    column.board.resolvedColumnType || 'REVIEW',
  );
  const closedColumnType = String(column.board.closedColumnType || 'DONE');
  const resolvedAt =
    targetColumn.columnType === resolvedColumnType ? now : null;
  const closedAt = targetColumn.columnType === closedColumnType ? now : null;

  const issue = await prisma.issue.create({
    data: {
      title,
      description,
      type: issueType,
      priority: (priority as string).toUpperCase(),
      assigneeId: assigneeId || null,
      parentId: parentId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      reporterId: userId,
      projectId: project.id,
      columnId: targetColumn.id,
      resolvedAt,
      closedAt,
    },
  });
  if (assigneeId) {
    const assigneeMember = project.members.find(
      (member) => member.userId === assigneeId,
    );
    if (!assigneeMember) throw new Error('ERROR_61');
    await prisma.notification.create({
      data: {
        userId: assigneeId,
        msg: `You have been assigned to a new issue "${title}"`,
        projId: project.id,
        read: false,
      },
    });
  }
  //an issue when created should be added to the audit log.
  await prisma.auditLog.create({
    data: {
      issueId: issue.id,
      userId: userId,
      action: 'Issue created',
      newValue: `Title: ${title}, Type: ${type}`,
    },
  });
  //If the created issue is a subtask, we need to derive the status of the parent story.
  if (issue.parentId) await deriveStoryStatus(issue.parentId);
  return issue;
};
