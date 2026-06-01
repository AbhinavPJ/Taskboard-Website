import {prisma} from '../../core/database/db';
import {IssueType, Prisma} from '@prisma/client';

/*
Design decision:
Status of story is not mutable by default, it can only be
mutated by chaning the status of its children.Also, 
since we have defined column type for each column, 
it is a good idea to set the status of the story based on the
child which is in the least progressed state.
*/
export async function deriveStoryStatus(storyId: string): Promise<void> {
  const story = await prisma.issue.findUnique({
    where: {id: storyId},
    include: {
      children: {include: {column: true}},
      column: {include: {board: {include: {columns: true}}}},
    },
  });
  if (!story || story.type !== IssueType.STORY) return;
  if (!story.children.length) return;
  if (!story.column) return;
  const board = story.column.board;
  const columns = [...board.columns].sort((a, b) => a.position - b.position);
  //find the minimum progress level among all children.
  let minProgress = 3;
  for (const child of story.children) {
    if (!child.column) continue;
    const column = columns.find((c) => c.id === child.columnId);
    if (!column) continue;
    if (column.columnType === 'TODO' && minProgress > 0) minProgress = 0;
    else if (column.columnType === 'INPROGRESS' && minProgress > 1)
      minProgress = 1;
    else if (column.columnType === 'REVIEW' && minProgress > 2) minProgress = 2;
    else if (column.columnType === 'DONE' && minProgress > 3) minProgress = 3;
  }
  let targetColumnType: string = 'TODO';
  if (minProgress === 1) targetColumnType = 'INPROGRESS';
  if (minProgress === 2) targetColumnType = 'REVIEW';
  if (minProgress === 3) targetColumnType = 'DONE';
  let targetColumn = null;
  for (const column of columns) {
    if (column.columnType === targetColumnType && column.scope === 'STORY') {
      targetColumn = column;
      break;
    }
  }
  if (!targetColumn || targetColumn.id === story.columnId) return;
  const timestampData: Pick<
    Prisma.IssueUpdateInput,
    'closedAt' | 'resolvedAt'
  > = {};
  //Design decision: DONE->resolved& closed
  //REVIEW-> resolved
  if (targetColumn.columnType === 'DONE') timestampData.closedAt = new Date();
  if (
    targetColumn.columnType === 'REVIEW' ||
    targetColumn.columnType === 'DONE'
  ) {
    if (!story.resolvedAt) timestampData.resolvedAt = new Date();
  }
  await prisma.issue.update({
    where: {id: storyId},
    data: {columnId: targetColumn.id, ...timestampData},
  });
  //we must push it to auditlogs too!
  // await prisma.auditLog.create({
  //   data: {
  //     issueId: storyId,
  //     userId: 'system',
  //     action: 'Implicit status change due to child status change',
  //     oldValue: story.column.name,
  //     newValue: targetColumn.name,
  //   },
  // });
}
