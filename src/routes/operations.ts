import { Router } from 'express';
import { authenticate, requireRegisteredUser } from '../middleware/auth';
import OperationController from '../controllers/operations-controller';

const router = Router();


router.post('/', authenticate, requireRegisteredUser, OperationController.create);
router.get('/discussion/:discussionId', OperationController.getByDiscussion);
router.get('/:id', OperationController.getById);

export default router;
