import { prisma } from '../../core/database/db';
import { ProjectRole, IssueType, Priority, Prisma } from '@prisma/client';
import { checkrole, isGlobalAdmin } from '../../core/middleware/utils';
import { deriveStoryStatus } from './issues.utils';

export const patchIssue = async (
  id: string,
  userId: string,
  data: {
    title?: string;
    description?: string;
    type?: IssueType;
    priority?: Priority;
    assigneeId?: string | null;
    dueDate?: string | null;
  },
) => {
  const { title, description, type, priority, assigneeId, dueDate } = data;
  const normalizedAssigneeId =
    assigneeId === undefined
      ? undefined
      : assigneeId === null || assigneeId.trim() === ''
        ? null
        : assigneeId;
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
  //throw error if issue not found.
  if (!issue) throw new Error('ERROR_31');
  if (!issue.column) throw new Error('ERROR_17');
  const project = issue.column?.board.project;
  //Only members, admins and global admins can edit issues.
  if (project) {
    const globalAdmin = await isGlobalAdmin(userId);
    if (
      !globalAdmin &&
      (await checkrole(userId, project.id, [
        ProjectRole.ADMIN,
        ProjectRole.MEMBER,
      ])) === false
    )
      throw new Error('ERROR_32');
  }

  //Initialize audit log array that holds all changes.
  const auditLogs: {
    issueId: string;
    userId: string;
    action: string;
    oldValue: string | null;
    newValue: string | null;
  }[] = [];
  //updateData consists the response json (all fields that are updated)
  const updateData: Prisma.IssueUpdateInput = {};
  if (title && title !== issue.title) {
    auditLogs.push({
      issueId: issue.id,
      userId: userId,
      action: 'Title changed',
      oldValue: issue.title,
      newValue: title,
    });
    updateData.title = title;
  }

  if (description && description !== issue.description) {
    auditLogs.push({
      issueId: issue.id,
      userId: userId,
      action: 'Description changed',
      oldValue: issue.description,
      newValue: description,
    });
    updateData.description = description;
  }

  if (priority && priority !== issue.priority) {
    auditLogs.push({
      issueId: issue.id,
      userId: userId,
      action: 'Priority changed',
      oldValue: String(issue.priority),
      newValue: String(priority),
    });
    updateData.priority = priority;
  }

  if (type && type !== issue.type) {
    auditLogs.push({
      issueId: issue.id,
      userId: userId,
      action: 'Type changed',
      oldValue: String(issue.type),
      newValue: String(type),
    });
    updateData.type = type;
  }

  if (
    normalizedAssigneeId !== undefined &&
    normalizedAssigneeId !== issue.assigneeId
  ) {
    auditLogs.push({
      issueId: issue.id,
      userId: userId,
      action: 'Assignee changed',
      oldValue: issue.assigneeId,
      newValue: normalizedAssigneeId,
    });
    if (normalizedAssigneeId) {
      //validate if the new assignee is a member of the project.
      const assigneeMember = await prisma.projectMember.findFirst({
        where: {
          userId: normalizedAssigneeId,
          projectId: issue.projectId,
        },
      });
      if (!assigneeMember) throw new Error('ERROR_61');
    }
    updateData.assigneeId = normalizedAssigneeId;

    if (normalizedAssigneeId) {
      await prisma.notification.create({
        data: {
          userId: normalizedAssigneeId,
          msg: `You were assigned to issue "${issue.title}"`,
          projId: issue.projectId,
          read: false,
        },
      });
    }
  }
  if (dueDate !== undefined) {
    let oldDate: string | null = null;
    if (issue.dueDate) {
      oldDate = issue.dueDate.toISOString().slice(0, 10);
    }
    let newDate: string | null = null;
    if (dueDate && dueDate.trim() !== '') {
      newDate = new Date(dueDate).toISOString().slice(0, 10);
    }
    if (oldDate !== newDate) {
      auditLogs.push({
        issueId: issue.id,
        userId,
        action: 'Due date changed',
        oldValue: oldDate,
        newValue: newDate,
      });
      updateData.dueDate = newDate ? new Date(newDate) : null;
    }
  }
  let updatedIssue = issue;
  //Check if any changes needed
  if (Object.keys(updateData).length > 0) {
    if (auditLogs.length > 0) {
      await prisma.auditLog.createMany({
        data: auditLogs,
      });
    }
    updatedIssue = await prisma.issue.update({
      where: { id: issue.id },
      data: updateData,
    });
  }
  return updatedIssue;
};
