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
}
