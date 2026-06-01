import {prisma} from '../../core/database/db';

/*
This is a utility function that is called whenever the count/meaning 
of columns change.We assume that by default, all transitions are allowed 
and, the user can block specific transitions. 
*/
export const resetAdjacencyMatrix = async (boardId: string) => {
  const columns = await prisma.column.findMany({
    where: {boardId, scope: 'TASKBUG'},
    orderBy: [{position: 'asc'}, {id: 'asc'}],
    select: {id: true},
  });
  const columnIds = columns.map((c) => c.id);
  const adjacencyMatrix = Array.from({length: columns.length}, () =>
    Array(columns.length).fill(1),
  );
  const existing = await prisma.workflowTransition.findUnique({
    where: {boardId},
  });
  if (existing) {
    return prisma.workflowTransition.update({
      where: {boardId},
      data: {
        columnIds,
        adjacencyMatrix,
      },
    });
  } else {
    return prisma.workflowTransition.create({
      data: {
        boardId,
        columnIds,
        adjacencyMatrix,
      },
    });
  }
};
