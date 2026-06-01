import {prisma} from '../../core/database/db';

export const fetchStats = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {id: userId},
  });
  //Throw error if user doesn't exist
  if (!user) throw new Error('User not found');
  //Count the number of projects that the user is a member of.
  const totalProjects = await prisma.project.count({
    where: {members: {some: {userId: userId}}},
  });
  //Count the number of tasks assigned to the user.
  const assignedTasks = await prisma.issue.count({
    where: {assigneeId: userId},
  });
  //Count the number of incomplete tasks where user is assignee.
  const activeTasks = await prisma.issue.count({
    where: {
      assigneeId: userId,
      NOT: {
        column: {name: {equals: 'Done', mode: 'insensitive'}},
      },
    },
  });

  //Count the number of completed tasks where user is assignee.
  const completedTasks = await prisma.issue.count({
    where: {
      assigneeId: userId,
      column: {name: {equals: 'Done', mode: 'insensitive'}},
    },
    //sanity check: completed+active should be equal to assigned tasks.
  });
  return {totalProjects, activeTasks, completedTasks, assignedTasks};
};

export const fetchRecentProjects = async (userId: string) => {
  //we want 5 most recently created projects, along with the number of tasks in each project.
  const recentProjects = await prisma.project.findMany({
    where: {members: {some: {userId: userId}}},
    orderBy: {createdAt: 'desc'},
    take: 5,
    include: {_count: {select: {issues: true}}},
  });
  //format the data to include task count as 'tasks' field.
  return recentProjects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    tasks: p._count.issues,
    colour: p.colour,
  }));
};

export const fetchRecentActivity = async (userId: string) => {
  const recentActivity = await prisma.notification.findMany({
    where: {userId: userId},
    orderBy: {time: 'desc'},
    take: 5,
  });
  //Compute the "time ago" badge for each notification.
  const formattedActivity = recentActivity.map((notif) => {
    const milliseconds = new Date().getTime() - new Date(notif.time).getTime();
    const minutes = Math.floor(milliseconds / 60000);
    const hrAgo = Math.floor(minutes / 60);
    let ago = '';
    if (hrAgo > 24) ago = `${Math.floor(hrAgo / 24)}d ago`;
    else if (hrAgo > 0) ago = `${hrAgo}h ago`;
    else ago = `${minutes}m ago`;
    return {
      id: notif.id,
      what: notif.msg,
      tag: '',
      ago: ago,
      read: notif.read,
    };
  });
  return formattedActivity;
};
