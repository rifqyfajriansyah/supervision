import { useEffect, useState } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import type { Task as GanttTask } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { fetchProjectSchedule } from '../services/api';
import type { Task } from '../services/api';

interface Props {
  projectId: string;
}

const GanttChart = ({ projectId }: Props) => {
  const [tasks, setTasks] = useState<GanttTask[]>([]);

  useEffect(() => {
    fetchProjectSchedule(projectId)
      .then((data: Task[]) => {
        const formattedTasks: GanttTask[] = data.map(t => ({
          start: new Date(t.start),
          end: new Date(t.end),
          name: t.name,
          id: t.id,
          progress: t.progress,
          type: 'task',
          dependencies: t.dependencies,
          styles: { progressColor: '#3B82F6', progressSelectedColor: '#2563EB' }
        }));
        setTasks(formattedTasks);
      })
      .catch((err) => {
         console.error(err);
         setTasks([]);
      });
  }, [projectId]);

  if (tasks.length === 0) return <div className="text-gray-400 flex justify-center items-center h-full">Loading Schedule...</div>;

  return (
    <div className="bg-white rounded p-2 text-black h-full">
       <Gantt tasks={tasks} viewMode={ViewMode.Month} />
    </div>
  );
};

export default GanttChart;
