import { Router } from 'express';
import { authenticate, requireRegisteredUser } from '../middleware/auth';
import DiscussionController from '../controllers/discussions-controller';

const router = Router();

router.post('/', authenticate, requireRegisteredUser, DiscussionController.create);
router.get('/', DiscussionController.getAll);
router.get('/:id', DiscussionController.getById);
router.patch('/:id', authenticate, requireRegisteredUser, DiscussionController.update);

export default router;
