import express from 'express';
import {
    getAllAssignments,
    createAssignment,
    deleteAssignment
} from '../controllers/assignmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllAssignments);
router.post('/', authorize('admin'), createAssignment);
router.delete('/:id', authorize('admin'), deleteAssignment);

export default router;
