import { Response } from 'express';
import { OperationRepository, DiscussionRepository, OperationType, computeResult } from '../models';
import { AuthRequest } from '../middleware/auth';

export const OperationController = {
  /**
   * POST /api/operations
   */
  async create(req: AuthRequest, res: Response) {
    try {
      const { discussionId, parentId, operationType, operand } = req.body;

      if (!discussionId || !operationType || operand === undefined || operand === null) {
        return res.status(400).json({
          error: 'discussionId, operationType, and operand are required',
        });
      }

      // Validate operation type
      const validOperations: OperationType[] = ['ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE'];
      if (!validOperations.includes(operationType)) {
        return res.status(400).json({
          error: 'operationType must be ADD, SUBTRACT, MULTIPLY, or DIVIDE',
        });
      }

      const discussion = await DiscussionRepository.findById(discussionId);

      if (!discussion) {
        return res.status(404).json({ error: 'Discussion not found' });
      }

      let previousValue: number;

      if (parentId) {
        // Responding to an existing operation
        const parentOperation = await OperationRepository.findById(parentId);

        if (!parentOperation) {
          return res.status(404).json({ error: 'Parent operation not found' });
        }

        if (parentOperation.discussionId !== discussionId) {
          return res.status(400).json({
            error: 'Parent operation does not belong to this discussion',
          });
        }

        previousValue = parentOperation.result;
      } else {
        // Responding directly to the discussion's starting number
        previousValue = discussion.startingNumber;
      }

      const result = computeResult(previousValue, operationType, parseFloat(operand));

      const operation = await OperationRepository.create({
        discussionId,
        parentId: parentId || null,
        operationType,
        operand: parseFloat(operand),
        result,
        authorId: req.userId!,
      });

      return res.status(201).json(operation);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  /**
   * GET /api/operations/discussion/:discussionId
   */
  async getByDiscussion(req: AuthRequest, res: Response) {
    try {
      const { discussionId } = req.params;

      if (!discussionId) {
        return res.status(400).json({ error: 'Discussion ID is required' });
      }

      const operations = await OperationRepository.findByDiscussion(discussionId);

      return res.json(operations);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  /**
   * GET /api/operations/:id
   */
  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Operation ID is required' });
      }

      const operation = await OperationRepository.findById(id);

      if (!operation) {
        return res.status(404).json({ error: 'Operation not found' });
      }

      return res.json(operation);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },
};

export default OperationController;
