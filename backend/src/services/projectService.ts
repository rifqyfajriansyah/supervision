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
}
