import { Router } from 'express';
import { getProjects, getProjectSchedule, getProjectSCurve } from '../controllers/projectController';

const router = Router();

router.get('/projects', getProjects);
router.get('/projects/:id/schedule', getProjectSchedule);
router.get('/projects/:id/s-curve', getProjectSCurve);

export default router;
