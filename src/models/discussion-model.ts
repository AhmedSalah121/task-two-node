import prisma from '../lib/prisma';

// ============================================================================
// REPOSITORY LAYER - Basic CRUD operations for controllers
// ============================================================================

export interface IDiscussionRepository {
  create(data: { startingNumber: number; authorId: string }): Promise<any>;
  findById(id: string): Promise<any>;
  findAll(): Promise<any[]>;
  update(id: string, data: { startingNumber: number }): Promise<any>;
  delete(id: string): Promise<any>;
}

export const DiscussionRepository: IDiscussionRepository = {
  async create(data: { startingNumber: number; authorId: string }) {
    return await prisma.discussion.create({
      data,
      include: {
        author: {
          select: { id: true, username: true, email: true },
        },
      },
    });
  },

  async findById(id: string) {
    return await prisma.discussion.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, email: true },
        },
        operations: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, username: true },
            },
          },
        },
      },
    });
  },

  async findAll() {
    return await prisma.discussion.findMany({
      include: {
        author: {
          select: { id: true, username: true, email: true },
        },
        operations: {
            // older operation first
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, username: true },
            },
          },
        },
      },
      // newer discusion first
      orderBy: { createdAt: 'desc' },
    });
  },

  async update(id: string, data: { startingNumber: number }) {
    return await prisma.discussion.update({
      where: { id },
      data,
      include: {
        author: {
          select: { id: true, username: true, email: true },
        },
      },
    });
  },

  async delete(id: string) {
    return await prisma.discussion.delete({
      where: { id },
    });
  },
};

// ============================================================================
// MODEL LAYER - Database queries and business logic
// ============================================================================

export const DiscussionModel = {
  async create(data: { startingNumber: number; authorId: string }) {
    return await prisma.discussion.create({
      data: {
        startingNumber: data.startingNumber,
        authorId: data.authorId,
      },
      include: {
        author: {
          select: { id: true, username: true, email: true },
        },
      },
    });
  },

  async findByStartingNumber(startingNumber: number) {
    return await prisma.discussion.findUnique({
      where: { startingNumber },
      include: {
        author: {
          select: { id: true, username: true, email: true },
        },
        _count: {
          select: { operations: true },
        },
      },
    });
  },

  async isStartingNumberTaken(startingNumber: number): Promise<boolean> {
    const existing = await prisma.discussion.findUnique({
      where: { startingNumber },
      select: { id: true },
    });
    return existing !== null;
  },

  async findById(id: string) {
    return await prisma.discussion.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, email: true },
        },
        operations: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, username: true },
            },
          },
        },
      },
    });
  },

  async findAll(options?: { skip?: number; take?: number }) {
    const query: any = {
      include: {
        author: {
          select: { id: true, username: true, email: true },
        },
        _count: {
          select: { operations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    };

    if (options?.skip !== undefined) query.skip = options.skip;
    if (options?.take !== undefined) query.take = options.take;

    return await prisma.discussion.findMany(query);
  },

  async findByAuthor(authorId: string) {
    return await prisma.discussion.findMany({
      where: { authorId },
      include: {
        _count: {
          select: { operations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
  
  async isAuthor(discussionId: string, userId: string): Promise<boolean> {
    const discussion = await prisma.discussion.findUnique({
      where: { id: discussionId },
      select: { authorId: true },
    });

    return discussion?.authorId === userId;
  },
};

export default DiscussionModel;
