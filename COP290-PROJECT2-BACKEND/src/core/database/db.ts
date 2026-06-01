import {PrismaClient} from '@prisma/client';

export const prisma = new PrismaClient();

prisma
  .$connect()
  .then(() => console.log('Database connected'))
  .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });

//Below is a way to gracefully end database connection
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
