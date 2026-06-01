import { prisma } from '../../core/database/db';
import { ProjectRole, IssueType } from '@prisma/client';
import { checkrole, isGlobalAdmin } from '../../core/middleware/utils';
import { deriveStoryStatus } from './issues.utils';
import { resetAdjacencyMatrix } from '../columns/columns.utils';

export const moveIssue = async (
  id: string,
  userId: string,
  columnId: string,
) => {
  const issue = await prisma.issue.findUnique({
    where: { id: id },
    include: {
      column: {
        include: {
          board: { include: { project: { include: { members: true } } } },
        },
      },
    },
  });
  if (!issue) throw new Error('ERROR_33');
  const project = issue.column?.board.project;
  if (!project) throw new Error('ERROR_40');
  const globalAdmin = await isGlobalAdmin(userId);
  if (
    !globalAdmin &&
    (await checkrole(userId, project.id, [
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ])) === false
  )
    throw new Error('ERROR_34');
  //Design decision: stories are not allowed to be moved across columns.
  if (issue.type === IssueType.STORY) throw new Error('ERROR_35');
  const toColumn = await prisma.column.findUnique({
    where: { id: columnId },
    include: { issues: true },
  });
  //throw error if column not found
  if (!toColumn) throw new Error('ERROR_36');
  if (toColumn.scope !== 'TASKBUG') throw new Error('ERROR_64');
  const boardId = issue.column?.boardId;
  if (!boardId) throw new Error('ERROR_5');
  let workflowTransition = await prisma.workflowTransition.findUnique({
    where: { boardId },
  });
  if (!workflowTransition) {
    workflowTransition = await resetAdjacencyMatrix(boardId);
  }

  const columnIds = Array.isArray(workflowTransition.columnIds)
    ? workflowTransition.columnIds.map((id) => String(id))
    : [];
  const adjacencyMatrix = Array.isArray(workflowTransition.adjacencyMatrix)
    ? (workflowTransition.adjacencyMatrix as number[][])
    : [];

  const fromIndex = columnIds.indexOf(issue.columnId || '');
  const toIndex = columnIds.indexOf(toColumn.id);
  const allowedValue =
    fromIndex >= 0 &&
    toIndex >= 0 &&
    Array.isArray(adjacencyMatrix[fromIndex]) &&
    Number((adjacencyMatrix[fromIndex] as number[])[toIndex]) === 1;

  if (!allowedValue) throw new Error('ERROR_37');

  if (toColumn.limit && toColumn.issues.length >= toColumn.limit)
    throw new Error('ERROR_38');

  const timestampData: { resolvedAt?: Date | null; closedAt?: Date | null } =
    {};
  const destType = String(toColumn.columnType || '').toUpperCase();
  const resolvedType = String(
    issue.column?.board.resolvedColumnType || '',
  ).toUpperCase();
  const closedType = String(
    issue.column?.board.closedColumnType || '',
  ).toUpperCase();
  const isResolvedState = destType === resolvedType;
  const isClosedState = destType === closedType;

  // resolvedAt follows configured resolved column type strictly.
  if (isResolvedState) {
    if (!issue.resolvedAt) timestampData.resolvedAt = new Date();
  } else {
    timestampData.resolvedAt = null;
  }
  // closedAt follows configured closed column type strictly.
  if (isClosedState) {
    if (!issue.closedAt) timestampData.closedAt = new Date();
  } else {
    timestampData.closedAt = null;
  }
  const oldColumnName = issue.column?.name ?? 'Unknown';
  //update auditlog
  await prisma.auditLog.create({
    data: {
      issueId: issue.id,
      userId: userId,
      action: 'Status changed',
      oldValue: oldColumnName,
      newValue: toColumn.name,
    },
  });
  //update timestamp data
  const updatedIssue = await prisma.issue.update({
    where: { id: issue.id },
    data: {
      column: { connect: { id: columnId } },
      ...timestampData,
    },
  });
  if (issue.assigneeId && issue.assigneeId !== userId) {
    await prisma.notification.create({
      data: {
        userId: issue.assigneeId,
        msg: `Issue "${issue.title}" moved from "${oldColumnName}" to "${toColumn.name}"`,
        projId: issue.projectId,
        read: false,
      },
    });
  }
  if (issue.reporterId !== userId && issue.reporterId !== issue.assigneeId) {
    await prisma.notification.create({
      data: {
        userId: issue.reporterId,
        msg: `Issue "${issue.title}" moved from "${oldColumnName}" to "${toColumn.name}"`,
        projId: issue.projectId,
        read: false,
      },
    });
  }
  //we must update status of parent story
  if (issue.parentId) await deriveStoryStatus(issue.parentId);

  return updatedIssue;
};
