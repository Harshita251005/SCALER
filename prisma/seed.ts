import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Seed users (members)
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { name: 'Alice Johnson', email: 'alice@example.com' },
  });
  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { name: 'Bob Smith', email: 'bob@example.com' },
  });
  const carol = await prisma.user.upsert({
    where: { email: 'carol@example.com' },
    update: {},
    create: { name: 'Carol White', email: 'carol@example.com' },
  });
  const dave = await prisma.user.upsert({
    where: { email: 'dave@example.com' },
    update: {},
    create: { name: 'Dave Brown', email: 'dave@example.com' },
  });

  // Seed a sample board
  const board = await prisma.board.create({
    data: {
      title: 'Product Launch',
      bgImgRes: 'linear-gradient(135deg, #0061ff 0%, #60efff 100%)',
    },
  });

  // Create lists
  const todo = await prisma.list.create({ data: { title: 'To Do', order: 0, boardId: board.id } });
  const inProgress = await prisma.list.create({ data: { title: 'In Progress', order: 1, boardId: board.id } });
  const review = await prisma.list.create({ data: { title: 'In Review', order: 2, boardId: board.id } });
  const done = await prisma.list.create({ data: { title: 'Done', order: 3, boardId: board.id } });

  // Create cards with labels, members, checklists
  const card1 = await prisma.card.create({
    data: {
      title: 'Design landing page mockup',
      description: 'Create a Figma mockup for the new landing page. Follow brand guidelines.',
      order: 0,
      listId: todo.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      members: { connect: [{ id: alice.id }, { id: carol.id }] },
      labels: { create: [{ color: '#61bd4f', text: 'Design' }, { color: '#0079bf', text: 'Frontend' }] },
      checklists: {
        create: [
          { text: 'Create wireframes', completed: true },
          { text: 'Review with team', completed: false },
          { text: 'Final approval', completed: false },
        ],
      },
    },
  });

  await prisma.card.create({
    data: {
      title: 'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for automated testing and deployment.',
      order: 1,
      listId: todo.id,
      members: { connect: [{ id: bob.id }] },
      labels: { create: [{ color: '#eb5a46', text: 'Urgent' }, { color: '#c377e0', text: 'DevOps' }] },
    },
  });

  await prisma.card.create({
    data: {
      title: 'Write API documentation',
      description: 'Document all REST endpoints using Swagger/OpenAPI spec.',
      order: 2,
      listId: todo.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      members: { connect: [{ id: dave.id }] },
      labels: { create: [{ color: '#ff9f1a', text: 'Docs' }] },
    },
  });

  await prisma.card.create({
    data: {
      title: 'Implement authentication',
      description: 'Add JWT-based auth with refresh tokens.',
      order: 0,
      listId: inProgress.id,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      members: { connect: [{ id: bob.id }, { id: alice.id }] },
      labels: { create: [{ color: '#eb5a46', text: 'Urgent' }, { color: '#0079bf', text: 'Backend' }] },
      checklists: {
        create: [
          { text: 'Login endpoint', completed: true },
          { text: 'Logout endpoint', completed: true },
          { text: 'Token refresh', completed: false },
          { text: 'Password reset flow', completed: false },
        ],
      },
    },
  });

  await prisma.card.create({
    data: {
      title: 'Database schema design',
      description: 'Design normalized schema for product and user tables.',
      order: 1,
      listId: inProgress.id,
      members: { connect: [{ id: carol.id }] },
      labels: { create: [{ color: '#0079bf', text: 'Backend' }] },
    },
  });

  await prisma.card.create({
    data: {
      title: 'Code review: User module',
      description: 'Review PRs for the user module feature branch.',
      order: 0,
      listId: review.id,
      members: { connect: [{ id: alice.id }, { id: dave.id }] },
      labels: { create: [{ color: '#61bd4f', text: 'Review' }] },
    },
  });

  await prisma.card.create({
    data: {
      title: 'Project kickoff meeting',
      description: 'Initial planning meeting with all stakeholders.',
      order: 0,
      listId: done.id,
      members: { connect: [{ id: alice.id }, { id: bob.id }, { id: carol.id }, { id: dave.id }] },
      labels: { create: [{ color: '#61bd4f', text: 'Complete' }] },
    },
  });

  await prisma.card.create({
    data: {
      title: 'Requirements gathering',
      description: 'Collected and documented all product requirements.',
      order: 1,
      listId: done.id,
      members: { connect: [{ id: carol.id }] },
      labels: { create: [{ color: '#61bd4f', text: 'Complete' }] },
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`   Board: ${board.title} (${board.id})`);
  console.log(`   Members: Alice, Bob, Carol, Dave`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
