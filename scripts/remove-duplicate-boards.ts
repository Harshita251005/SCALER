import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const boards = await prisma.board.findMany({
    where: { title: 'Product Launch' },
    orderBy: { createdAt: 'asc' },
  });

  console.log('Found boards:', boards.map(b => ({ id: b.id, title: b.title, createdAt: b.createdAt })));

  if (boards.length > 1) {
    const toDelete = boards.slice(1).map(b => b.id);
    await prisma.board.deleteMany({ where: { id: { in: toDelete } } });
    console.log('Deleted duplicate board IDs:', toDelete);
  } else {
    console.log('No duplicates found.');
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
