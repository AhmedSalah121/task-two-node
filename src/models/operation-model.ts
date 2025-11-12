import prisma from '../lib/prisma';

export type OperationType = 'ADD' | 'SUBTRACT' | 'MULTIPLY' | 'DIVIDE';

// ============================================================================
// REPOSITORY LAYER - Basic CRUD operations for controllers
// ============================================================================

export interface IOperationRepository {
  create(data: {
    discussionId: string;
    parentId: string | null;
    operationType: string;
    operand: number;
    result: number;
    authorId: string;
  }): Promise<any>;
  findById(id: string): Promise<any>;
  findByDiscussion(discussionId: string): Promise<any[]>;
}

export const OperationRepository: IOperationRepository = {
  async create(data: {
    discussionId: string;
    parentId: string | null;
    operationType: string;
    operand: number;
    result: number;
    authorId: string;
  }) {
    return await prisma.operation.create({
      data,
      include: {
        author: {
          select: { id: true, username: true, email: true },
        },
        parent: true,
      },
    });
  },

  async findById(id: string) {
    return await prisma.operation.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, email: true },
        },
        parent: true,
        children: {
          include: {
            author: {
              select: { id: true, username: true },
            },
          },
        },
        discussion: true,
      },
    });
  },

  async findByDiscussion(discussionId: string) {
    return await prisma.operation.findMany({
      where: { discussionId },
      include: {
        author: {
          select: { id: true, username: true },
        },
        parent: true,
        children: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  },
};

// ============================================================================
// UTILITY FUNCTIONS - Helper functions
// ============================================================================

/**
 * Compute Result
 * 
 * Calculates the result of a mathematical operation.
 * Used by controllers to compute operation results before saving.
 * 
 * @param previousValue - The starting value or result from parent operation
 * @param operation - The mathematical operation type (ADD, SUBTRACT, MULTIPLY, DIVIDE)
 * @param operand - The number to operate with
 * @returns The computed result
 * @throws Error if operation type is invalid or division by zero
 */
export function computeResult(previousValue: number, operation: OperationType, operand: number): number {
  switch (operation) {
    case 'ADD':
      return previousValue + operand;
    case 'SUBTRACT':
      return previousValue - operand;
    case 'MULTIPLY':
      return previousValue * operand;
    case 'DIVIDE':
      if (operand === 0) {
        throw new Error('Division by zero is not allowed');
      }
      return previousValue / operand;
    default:
      throw new Error(`Invalid operation type: ${operation}`);
  }
}

// ============================================================================
// MODEL LAYER - Extended queries and business logic
// ============================================================================


export const OperationModel = {
  computeResult,
  isValidOperationType(type: string): type is OperationType {
    return ['ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE'].includes(type);
  },

  async create(data: {
    discussionId: string;
    parentId: string | null;
    operationType: OperationType;
    operand: number;
    result: number;
    authorId: string;
  }) {
    return await prisma.operation.create({
      data: {
        discussionId: data.discussionId,
        parentId: data.parentId,
        operationType: data.operationType,
        operand: data.operand,
        result: data.result,
        authorId: data.authorId,
      },
      include: {
        author: {
          select: { id: true, username: true, email: true },
        },
        parent: true,
      },
    });
  },

  async findById(id: string) {
    return await prisma.operation.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, email: true },
        },
        parent: true,
        children: {
          include: {
            author: {
              select: { id: true, username: true },
            },
          },
        },
        discussion: true,
      },
    });
  },

  async findByDiscussion(discussionId: string) {
    return await prisma.operation.findMany({
      where: { discussionId },
      include: {
        author: {
          select: { id: true, username: true },
        },
        parent: true,
        children: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  async findByAuthor(authorId: string) {
    return await prisma.operation.findMany({
      where: { authorId },
      include: {
        discussion: {
          select: { id: true, startingNumber: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getChildren(operationId: string) {
    return await prisma.operation.findMany({
      where: { parentId: operationId },
      include: {
        author: {
          select: { id: true, username: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  async getRootOperations(discussionId: string) {
    return await prisma.operation.findMany({
      where: {
        discussionId,
        parentId: null,
      },
      include: {
        author: {
          select: { id: true, username: true },
        },
        children: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  /**
   * Get operation chain (path from root to this operation)
   */
  async getOperationChain(operationId: string): Promise<any[]> {
    const chain: any[] = [];
    let currentOperation = await prisma.operation.findUnique({
      where: { id: operationId },
      include: {
        author: {
          select: { id: true, username: true },
        },
      },
    });

    while (currentOperation) {
      chain.unshift(currentOperation);
      if (!currentOperation.parentId) break;
      
      currentOperation = await prisma.operation.findUnique({
        where: { id: currentOperation.parentId },
        include: {
          author: {
            select: { id: true, username: true },
          },
        },
      });
    }

    return chain;
  },

  /**
   * Check if user is the author of an operation
   */
  async isAuthor(operationId: string, userId: string): Promise<boolean> {
    const operation = await prisma.operation.findUnique({
      where: { id: operationId },
      select: { authorId: true },
    });

    return operation?.authorId === userId;
  },

  /**
   * Get the previous value for a new operation
   */
  async getPreviousValue(discussionId: string, parentId: string | null): Promise<number> {
    if (parentId) {
      const parentOperation = await prisma.operation.findUnique({
        where: { id: parentId },
        select: { result: true, discussionId: true },
      });

      if (!parentOperation) {
        throw new Error('Parent operation not found');
      }

      if (parentOperation.discussionId !== discussionId) {
        throw new Error('Parent operation does not belong to this discussion');
      }

      return parentOperation.result;
    } else {
      const discussion = await prisma.discussion.findUnique({
        where: { id: discussionId },
        select: { startingNumber: true },
      });

      if (!discussion) {
        throw new Error('Discussion not found');
      }

      return discussion.startingNumber;
    }
  },

  /**
   * Count total operations in a discussion
   */
  async countByDiscussion(discussionId: string): Promise<number> {
    return await prisma.operation.count({
      where: { discussionId },
    });
  },
};

export default OperationModel;
