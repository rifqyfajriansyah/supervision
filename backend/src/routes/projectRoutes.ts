import { Router } from 'express';
import { getProjects, getProjectSchedule, getProjectSCurve, addTaskToSchedule } from '../controllers/projectController';

const router = Router();

router.get('/projects', getProjects);
router.get('/projects/:id/schedule', getProjectSchedule);
router.get('/projects/:id/s-curve', getProjectSCurve);
router.post('/projects/:id/schedule', addTaskToSchedule);

export default router;
