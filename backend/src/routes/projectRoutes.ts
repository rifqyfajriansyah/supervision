import { Router } from 'express';
import { getProjects, getProjectSchedule, getProjectSCurve, addTaskToSchedule, editTaskInSchedule, reorderTasksInSchedule } from '../controllers/projectController';

const router = Router();

router.get('/projects', getProjects);
router.get('/projects/:id/schedule', getProjectSchedule);
router.get('/projects/:id/s-curve', getProjectSCurve);
router.post('/projects/:id/schedule', addTaskToSchedule);
router.put('/projects/:id/schedule/reorder', reorderTasksInSchedule);
router.put('/projects/:id/schedule/:taskId', editTaskInSchedule);

export default router;
