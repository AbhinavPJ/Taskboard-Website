import { prisma } from '../core/database/db';
import { afterAll, beforeAll } from 'vitest';
import fs from 'fs';
beforeAll(async () => {
  await prisma.auditLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.column.deleteMany();
  await prisma.board.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
});
afterAll(async () => {
  await prisma.$disconnect();
  if (fs.existsSync('cookies.txt')) {
    fs.unlinkSync('cookies.txt');
  }
});
