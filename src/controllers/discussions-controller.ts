import { Response } from 'express';
import { DiscussionRepository, DiscussionModel } from '../models';
import { AuthRequest } from '../middleware/auth';
import { Prisma } from '@prisma/client';

export const DiscussionController = {
  /**
   * POST /api/discussions
   */
  async create(req: AuthRequest, res: Response) {
    try {
      const { startingNumber } = req.body;

      if (startingNumber === undefined || startingNumber === null) {
        return res.status(400).json({ error: 'startingNumber is required' });
      }

      const numberValue = parseFloat(startingNumber);

      const existing = await DiscussionModel.findByStartingNumber(numberValue);

      if (existing) {
        return res.status(409).json({
          error: 'This starting number is already taken',
          existingDiscussion: {
            id: existing.id,
            startingNumber: existing.startingNumber,
          },
        });
      }

      const discussion = await DiscussionRepository.create({
        startingNumber: numberValue,
        authorId: req.userId!,
      });

      return res.status(201).json(discussion);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  /**
   * GET /api/discussions
   */
  async getAll(req: AuthRequest, res: Response) {
    try {
      const discussions = await DiscussionRepository.findAll();

      return res.json(discussions);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  /**
   * GET /api/discussions/:id
   */
  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Discussion ID is required' });
      }

      const discussion = await DiscussionRepository.findById(id);

      if (!discussion) {
        return res.status(404).json({ error: 'Discussion not found' });
      }

      return res.json(discussion);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  /**
   * Update a discussion's starting number (only by author)
   * PATCH /api/discussions/:id
   */
  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { startingNumber } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Discussion ID is required' });
      }

      if (startingNumber === undefined || startingNumber === null) {
        return res.status(400).json({ error: 'startingNumber is required' });
      }

      const discussion = await DiscussionRepository.findById(id);

      if (!discussion) {
        return res.status(404).json({ error: 'Discussion not found' });
      }

      if (discussion.authorId !== req.userId) {
        return res.status(403).json({ error: 'Not authorized to update this discussion' });
      }

      const numberValue = parseFloat(startingNumber);

      if (numberValue !== discussion.startingNumber) {
        const existing = await DiscussionModel.findByStartingNumber(numberValue);

        if (existing) {
          return res.status(409).json({
            error: 'This starting number is already taken by another discussion',
            existingDiscussion: {
              id: existing.id,
              startingNumber: existing.startingNumber,
            },
          });
        }
      }

      const updated = await DiscussionRepository.update(id, { startingNumber: numberValue });

      return res.json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },
};

export default DiscussionController;
