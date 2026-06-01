import { prisma } from '../../core/database/db';
import { ProjectRole, IssueType } from '@prisma/client';
import { checkrole, isGlobalAdmin } from '../../core/middleware/utils';
import { deriveStoryStatus } from './issues.utils';
export const fetchIssueById = async (id: string) => {
  const issue = await prisma.issue.findUnique({
    where: { id: id },
    include: {
      assignee: true,
      reporter: true,
      comments: {
        include: { author: true },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      },
      auditLogs: { include: { user: true }, orderBy: { createdAt: 'desc' } },
      parent: true,
      children: { include: { column: true } },
      column: true,
    },
  });
  if (!issue) throw new Error('ERROR_30');
  if (!issue.column) throw new Error('ERROR_17');
  //add a new field status to the issue.
  const commentsWithMeta = issue.comments.map((comment) => ({
    ...comment,
    parentId: comment.parentId,
    userName: comment.author ? comment.author.name : null,
    replies: [] as any[],
  }));
  const commentsById = new Map(commentsWithMeta.map((c) => [c.id, c]));
  const commentsList: any[] = [];
  for (const comment of commentsWithMeta) {
    if (comment.parentId && commentsById.has(comment.parentId)) {
      commentsById.get(comment.parentId)?.replies.push(comment);
    } else {
      commentsList.push(comment);
    }
  }
  //add status field to each child issue based on the column name, if column is null, status is "Unassigned"
  const children = issue.children.map((child) => ({
    ...child,
    status: child.column.columnType ? child.column.columnType : 'Unassigned',
  }));
  return {
    ...issue,
    status: issue.column.columnType,
    assigneeName: issue.assignee ? issue.assignee.name : null,
    reporterName: issue.reporter ? issue.reporter.name : null,
    parentTitle: issue.parent ? issue.parent.title : null,
    comments: commentsList,
    children: children,
  };
};

export const createCommentOnIssue = async (
  issueId: string,
  userId: string,
  content: string,
  parentId?: string,
) => {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      column: {
        include: {
          board: { include: { project: { include: { members: true } } } },
        },
      },
    },
  });
  //throw error if no such issue.
  if (!issue) throw new Error('ERROR_42');
  if (!issue.column) throw new Error('ERROR_17');
  const project = issue.column.board.project;
  if (!project) throw new Error('ERROR_40');
  //only admins,members and global admins can comment on issues.
  const globalAdmin = await isGlobalAdmin(userId);
  if (
    !globalAdmin &&
    (await checkrole(userId, project.id, [
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ])) === false
  )
    throw new Error('ERROR_43');
  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
    });
    if (!parentComment || parentComment.issueId !== issueId)
      throw new Error('ERROR_73');
  }
  const comment = await prisma.comment.create({
    data: {
      content,
      issueId: issueId,
      userId: userId,
      parentId: parentId || null,
    },
  });
  //add to auditLog
  await prisma.auditLog.create({
    data: {
      issueId: issue.id,
      userId: userId,
      action: 'Comment added',
      oldValue: null,
      newValue: content.substring(0, 200),
    },
  });
  //below regex finds all patterns: @username, we create a notification for each mentioned user.
  const mentionedUsernames = content.match(/@([a-zA-Z0-9_]+)/g);
  if (mentionedUsernames && mentionedUsernames.length > 0) {
    const usernames = mentionedUsernames.map((u: string) => u.substring(1));
    const mentionedUsers = await prisma.user.findMany({
      where: { username: { in: usernames } },
    });
    //check if they belong to the same project, if yes create notification.
    for (const user of mentionedUsers) {
      if (
        (await checkrole(user.id, project.id, [
          ProjectRole.ADMIN,
          ProjectRole.MEMBER,
          ProjectRole.VIEWER,
        ])) === false
      )
        continue;
      await prisma.notification.create({
        data: {
          userId: user.id,
          msg: `You were mentioned in a comment on issue "${issue.title}"`,
          projId: issue.projectId,
          read: false,
        },
      });
    }
  }
  //Also notify the assignee, if the commenter is not the assigne.
  if (issue.assigneeId && issue.assigneeId !== userId) {
    await prisma.notification.create({
      data: {
        userId: issue.assigneeId,
        msg: `New comment on issue "${issue.title}" you are assigned to`,
        projId: issue.projectId,
        read: false,
      },
    });
  }
  return comment;
};

export const deleteIssue = async (id: string, userId: string) => {
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
  if (!issue) throw new Error('ERROR_39');
  if (!issue.column) throw new Error('ERROR_17');
  const project = issue.column?.board.project;
  if (!project) throw new Error('ERROR_40');
  //only project admins, members and global admins can delete issues.
  const globalAdmin = await isGlobalAdmin(userId);
  if (
    !globalAdmin &&
    (await checkrole(userId, project.id, [
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ])) === false
  )
    throw new Error('ERROR_41');
  const parentId = issue.parentId;
  await prisma.issue.updateMany({
    where: { parentId: issue.id },
    data: { parentId: null },
  });
  await prisma.issue.delete({ where: { id: issue.id } });
  //since we deleted an issue, we must update status of parent story if applicable.
  if (parentId) await deriveStoryStatus(parentId);
  return { ok: true };
};

export const fetchIssueActivity = async (id: string, userId: string) => {
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      column: {
        include: {
          board: { include: { project: { include: { members: true } } } },
        },
      },
    },
  });

  if (!issue) throw new Error('ERROR_30');
  if (!issue.column) throw new Error('ERROR_17');

  const project = issue.column.board.project;
  if (!project) throw new Error('ERROR_40');

  const globalAdmin = await isGlobalAdmin(userId);
  if (
    !globalAdmin &&
    (await checkrole(userId, project.id, [
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
      ProjectRole.VIEWER,
    ])) === false
  )
    throw new Error('ERROR_43');

  const logs = await prisma.auditLog.findMany({
    where: { issueId: id },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    oldValue: log.oldValue,
    newValue: log.newValue,
    createdAt: log.createdAt,
    userId: log.userId,
    userName: log.user ? log.user.name : null,
  }));
};
