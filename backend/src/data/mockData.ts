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
  type?: 'task' | 'project' | 'milestone';
  project?: string; // ID of the parent task/project
  hideChildren?: boolean;
}

export const projects: Project[] = [
  { id: "1", name: "Road 80", stage: "Build", spi: 0.35, cpi: 0.55, status: "Flagged", progress: 12.5, lat: -2.5, lng: 118.0 },
  { id: "2", name: "Bridge71", stage: "Build", spi: 0.48, cpi: 0.75, status: "Flagged", progress: 34.0, lat: -6.2, lng: 106.8 },
  { id: "3", name: "Road 33", stage: "Build", spi: 0.53, cpi: 0.51, status: "Delayed", progress: 45.0, lat: -7.0, lng: 110.4 },
  { id: "4", name: "Road 77", stage: "Build", spi: 0.61, cpi: 0.65, status: "Delayed", progress: 55.0, lat: -3.3, lng: 114.6 },
  { id: "5", name: "Road 65", stage: "Build", spi: 0.68, cpi: 0.76, status: "Delayed", progress: 68.0, lat: -0.5, lng: 117.1 },
  { id: "6", name: "Road 5c", stage: "Build", spi: 0.71, cpi: 0.88, status: "Delayed", progress: 75.0, lat: -5.1, lng: 119.4 },
  { id: "7", name: "Konstruksi Jalan Segmen II", stage: "Build", spi: 0.94, cpi: 0.85, status: "Perform", progress: 58.0, lat: -8.5, lng: 140.4 }
];

export const projectSchedules: Record<string, Task[]> = {
  "1": [
    { id: "p1", name: "Road 80 Project", start: "2025-01-01", end: "2026-03-31", progress: 40, dependencies: [], type: "project", hideChildren: false },
    { id: "ph1", name: "Phase 1: Foundation", start: "2025-01-01", end: "2025-05-30", progress: 60, dependencies: [], type: "project", project: "p1", hideChildren: false },
    { id: "t1", name: "Site Preparation", start: "2025-01-01", end: "2025-02-15", progress: 100, dependencies: [], type: "task", project: "ph1" },
    { id: "t2", name: "Earthwork", start: "2025-02-16", end: "2025-05-30", progress: 40, dependencies: ["t1"], type: "task", project: "ph1" },
    { id: "ph2", name: "Phase 2: Construction", start: "2025-06-01", end: "2026-03-31", progress: 0, dependencies: ["ph1"], type: "project", project: "p1", hideChildren: false },
    { id: "t3", name: "Structure", start: "2025-06-01", end: "2025-10-31", progress: 0, dependencies: [], type: "task", project: "ph2" },
    { id: "t4", name: "Pavement", start: "2025-11-01", end: "2026-03-31", progress: 0, dependencies: ["t3"], type: "task", project: "ph2" },
  ],
  "7": [
    { id: "p7", name: "Jalan Segmen II", start: "2025-11-06", end: "2026-12-31", progress: 95, dependencies: [], type: "project", hideChildren: false },
    { id: "t1", name: "Site Preparation", start: "2025-11-06", end: "2025-12-31", progress: 100, dependencies: [], type: "task", project: "p7" },
    { id: "t2", name: "Excavation/Cut", start: "2026-01-01", end: "2026-03-15", progress: 100, dependencies: ["t1"], type: "task", project: "p7" },
    { id: "t3", name: "Ground Improvement", start: "2026-03-16", end: "2026-07-31", progress: 95, dependencies: ["t2"], type: "task", project: "p7" },
    { id: "t4", name: "PVD + Preload", start: "2026-08-01", end: "2026-12-31", progress: 92, dependencies: ["t3"], type: "task", project: "p7" },
  ]
};

export const projectSCurves: Record<string, { planned: number[], actual: number[] }> = {
  "1": {
    planned: [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 85, 100],
    actual: [4, 8, 12, 16, 20, 24, 30, 35, 40]
  },
  "7": {
    planned: [2, 5, 10, 15, 25, 35, 45, 55, 65, 80, 90, 100],
    actual: [2, 6, 11, 16, 28, 40, 50, 58]
  }
};
