import { Request, Response } from 'express';
import { ProjectService } from '../services/projectService';

const projectService = new ProjectService();

export const getProjects = (req: Request, res: Response) => {
  const data = projectService.getAllProjects();
  res.json(data);
};

export const getProjectSchedule = (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = projectService.getProjectSchedule(id);
  if (data) {
    res.json(data);
  } else {
    res.status(404).json({ error: 'Schedule not found' });
  }
};

export const getProjectSCurve = (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = projectService.getProjectSCurve(id);
  if (data) {
    res.json(data);
  } else {
    res.status(404).json({ error: 'S-Curve not found' });
  }
};

export const addTaskToSchedule = (req: Request, res: Response) => {
  const id = req.params.id as string;
  const taskData = req.body;
  try {
    const newTask = projectService.addTask(id, taskData);
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add task' });
  }
};
