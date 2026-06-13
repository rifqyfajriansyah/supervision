import { projects, projectSchedules, projectSCurves, Project, Task } from '../data/mockData';

export class ProjectService {
  public getAllProjects(): Project[] {
    return projects;
  }

  public getProjectSchedule(projectId: string): Task[] | null {
    return projectSchedules[projectId] || null;
  }

  public getProjectSCurve(projectId: string): { planned: number[], actual: number[] } | null {
    return projectSCurves[projectId] || null;
  }

  public addTask(projectId: string, taskData: Omit<Task, 'id'>): Task {
    if (!projectSchedules[projectId]) {
      projectSchedules[projectId] = [];
    }
    const newTask: Task = {
      id: `t${Date.now()}`,
      ...taskData
    };
    projectSchedules[projectId].push(newTask);
    return newTask;
  }

  public editTask(projectId: string, taskId: string, taskData: Partial<Omit<Task, 'id'>>): Task | null {
    if (!projectSchedules[projectId]) return null;
    
    const taskIndex = projectSchedules[projectId].findIndex(t => t.id === taskId);
    if (taskIndex === -1) return null;

    const updatedTask = {
      ...projectSchedules[projectId][taskIndex],
      ...taskData
    };
    projectSchedules[projectId][taskIndex] = updatedTask;
    return updatedTask;
  }

  public reorderTasks(projectId: string, taskIds: string[]): boolean {
    if (!projectSchedules[projectId]) return false;
    
    const taskMap = new Map(projectSchedules[projectId].map(t => [t.id, t]));
    const newSchedule: Task[] = [];
    
    for (const id of taskIds) {
      if (taskMap.has(id)) {
        newSchedule.push(taskMap.get(id)!);
      }
    }
    
    if (newSchedule.length !== projectSchedules[projectId].length) {
      const addedIds = new Set(taskIds);
      for (const t of projectSchedules[projectId]) {
        if (!addedIds.has(t.id)) newSchedule.push(t);
      }
    }
    
    projectSchedules[projectId] = newSchedule;
    return true;
  }
}
