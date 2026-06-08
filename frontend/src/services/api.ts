export interface Project {
  id: string;
  name: string;
  stage: string;
  spi: number;
  cpi: number;
  status: 'Perform' | 'Underperform' | 'Critical' | 'Flagged' | 'Delayed';
  progress: number;
  lat: number;
  lng: number;
}

export interface Task {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies: string[];
}

const API_BASE_URL = import.meta.env.MODE === 'production' ? '/api' : 'http://localhost:3001/api';

export const fetchProjects = async (): Promise<Project[]> => {
  const res = await fetch(`${API_BASE_URL}/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
};

export const fetchProjectSchedule = async (id: string): Promise<Task[]> => {
  const res = await fetch(`${API_BASE_URL}/projects/${id}/schedule`);
  if (!res.ok) throw new Error('Failed to fetch schedule');
  return res.json();
};

export const fetchProjectSCurve = async (id: string): Promise<{ planned: number[], actual: number[] }> => {
  const res = await fetch(`${API_BASE_URL}/projects/${id}/s-curve`);
  if (!res.ok) throw new Error('Failed to fetch S-curve');
  return res.json();
};

export const addTask = async (projectId: string, taskData: Omit<Task, 'id'>): Promise<Task> => {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData)
  });
  if (!res.ok) throw new Error('Failed to add task');
  return res.json();
};

export const editTask = async (projectId: string, taskId: string, taskData: Partial<Omit<Task, 'id'>>): Promise<Task> => {
  const res = await fetch(`${API_BASE_URL}/projects/${projectId}/schedule/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData)
  });
  if (!res.ok) throw new Error('Failed to edit task');
  return res.json();
};
