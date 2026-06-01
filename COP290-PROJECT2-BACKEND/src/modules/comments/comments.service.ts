import {prisma} from '../../core/database/db';
import {ProjectRole} from '@prisma/client';
import {checkrole, isGlobalAdmin} from '../../core/middleware/utils';

export const patchComment = async (
  commentId: string,
  userId: string,
  content,
) => {
  const comment = await prisma.comment.findUnique({
    where: {id: commentId},
    include: {
      issue: {
        include: {
          column: {
            include: {
              board: {
                //Fetch project and its members.
                include: {project: {include: {members: true}}},
              },
            },
          },
        },
      },
    },
  });
  //Throw error if no such comment.
  if (!comment) throw new Error('ERROR_22');
  const column = comment.issue.column;
  //Throw error if no such column
  if (!column) throw new Error('ERROR_23');
  const project = column.board.project;
  //Design decisions: Only admins, members and global admins can edit the comment.
  const globalAdmin = await isGlobalAdmin(userId);
  if (
    !globalAdmin &&
    (await checkrole(userId, project.id, [
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ])) === false
  )
    throw new Error('ERROR_24');
  //Design decision: Only comment author and global admins can edit the comment.
  if (!globalAdmin && comment.userId !== userId) throw new Error('ERROR_25');
  const oldContent = comment.content;
  const updatedComment = await prisma.comment.update({
    where: {id: commentId},
    data: {content},
  });
  //Insert into audit log
  await prisma.auditLog.create({
    data: {
      issueId: comment.issueId,
      userId: userId,
      action: 'Comment edited',
      oldValue: oldContent.substring(0, 200),
      newValue: content.substring(0, 200),
    },
  });
  return updatedComment;
};

export const deleteComment = async (commentId: string, userId: string) => {
  const comment = await prisma.comment.findUnique({
    where: {id: commentId},
    include: {
      issue: {
        include: {
          column: {
            include: {
              board: {
                include: {project: {include: {members: true}}},
              },
            },
          },
        },
      },
    },
  });
  if (!comment) throw new Error('ERROR_26');
  const column = comment.issue.column;
  if (!column) throw new Error('ERROR_27');
  const project = column.board.project;
  const globalAdmin = await isGlobalAdmin(userId);
  if (
    !globalAdmin &&
    (await checkrole(userId, project.id, [
      ProjectRole.ADMIN,
      ProjectRole.MEMBER,
    ])) === false
  )
    throw new Error('ERROR_28');
  if (!globalAdmin && comment.userId !== userId) throw new Error('ERROR_29');

  await prisma.auditLog.create({
    data: {
      issueId: comment.issueId,
      userId: userId,
      action: 'Comment deleted',
      oldValue: comment.content.substring(0, 200),
      newValue: null,
    },
  });

  await prisma.comment.delete({
    where: {id: commentId},
  });
  return {ok: true};
};
