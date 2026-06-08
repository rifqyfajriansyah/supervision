import { useEffect, useState } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import type { Task as GanttTask } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { fetchProjectSchedule, addTask } from '../services/api';
import type { Task } from '../services/api';

interface Props {
  projectId: string;
}

const GanttChart = ({ projectId }: Props) => {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskStart, setNewTaskStart] = useState('');
  const [newTaskEnd, setNewTaskEnd] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const loadSchedule = () => {
    setIsLoading(true);
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
        setIsLoading(false);
      })
      .catch((err) => {
         console.error(err);
         setTasks([]);
         setIsLoading(false);
      });
  };

  useEffect(() => {
    loadSchedule();
  }, [projectId]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName || !newTaskStart || !newTaskEnd) return;
    setIsAdding(true);
    try {
      await addTask(projectId, {
        name: newTaskName,
        start: newTaskStart,
        end: newTaskEnd,
        progress: 0,
        dependencies: []
      });
      // Reset form
      setNewTaskName('');
      setNewTaskStart('');
      setNewTaskEnd('');
      // Reload schedule
      loadSchedule();
    } catch (err) {
      console.error(err);
      alert('Failed to add task');
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) return <div className="text-gray-400 flex justify-center items-center h-full">Loading Schedule...</div>;

  return (
    <div className="bg-white rounded p-4 text-black h-full flex flex-col">
      <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
        <input 
          type="text" 
          placeholder="Task Name" 
          className="border border-gray-300 rounded px-2 py-1 flex-1 text-sm"
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
        />
        <input 
          type="date" 
          className="border border-gray-300 rounded px-2 py-1 text-sm"
          value={newTaskStart}
          onChange={(e) => setNewTaskStart(e.target.value)}
        />
        <input 
          type="date" 
          className="border border-gray-300 rounded px-2 py-1 text-sm"
          value={newTaskEnd}
          onChange={(e) => setNewTaskEnd(e.target.value)}
        />
        <button 
          type="submit" 
          disabled={isAdding}
          className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {isAdding ? 'Adding...' : 'Add Task'}
        </button>
      </form>
      
      <div className="flex-1 overflow-auto">
        {tasks.length === 0 ? (
           <div className="text-gray-500 flex justify-center items-center h-full">No tasks available for this project.</div>
        ) : (
           <Gantt tasks={tasks} viewMode={ViewMode.Day} />
        )}
      </div>
    </div>
  );
};

export default GanttChart;
