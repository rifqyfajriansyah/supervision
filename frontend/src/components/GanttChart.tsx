import { useEffect, useState } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import type { Task as GanttTask } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { fetchProjectSchedule, addTask } from '../services/api';
import type { Task } from '../services/api';
import { Plus, X } from 'lucide-react';

interface Props {
  projectId: string;
}

const GanttChart = ({ projectId }: Props) => {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal & Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskStart, setNewTaskStart] = useState('');
  const [newTaskEnd, setNewTaskEnd] = useState('');
  const [newTaskDependencies, setNewTaskDependencies] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Day);

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
        dependencies: newTaskDependencies
      });
      // Reset form
      setNewTaskName('');
      setNewTaskStart('');
      setNewTaskEnd('');
      setNewTaskDependencies([]);
      setIsModalOpen(false);
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
    <div className="bg-white rounded p-4 text-black h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">View:</label>
          <select 
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value={ViewMode.Day}>Day</option>
            <option value={ViewMode.Week}>Week</option>
            <option value={ViewMode.Month}>Month</option>
          </select>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>
      
      <div className="flex-1 overflow-auto">
        {tasks.length === 0 ? (
           <div className="text-gray-500 flex justify-center items-center h-full">No tasks available for this project.</div>
        ) : (
           <Gantt 
             tasks={tasks} 
             viewMode={viewMode} 
             onDateChange={(task: GanttTask) => {
               setTasks(tasks.map(t => (t.id === task.id ? task : t)));
               // Di sini nantinya bisa panggil API backend buat update tanggalnya
             }}
             onProgressChange={(task: GanttTask) => {
               setTasks(tasks.map(t => (t.id === task.id ? task : t)));
             }}
           />
        )}
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-96 shadow-2xl text-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Add New Task</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                 <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddTask} className="flex flex-col gap-4">
               <div>
                 <label className="block text-sm text-gray-400 mb-1">Task Name</label>
                 <input 
                   type="text" 
                   className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                   value={newTaskName}
                   onChange={(e) => setNewTaskName(e.target.value)}
                   required
                 />
               </div>
               <div>
                 <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                 <input 
                   type="date" 
                   className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                   value={newTaskStart}
                   onChange={(e) => setNewTaskStart(e.target.value)}
                   required
                 />
               </div>
               <div>
                 <label className="block text-sm text-gray-400 mb-1">End Date</label>
                 <input 
                   type="date" 
                   className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                   value={newTaskEnd}
                   onChange={(e) => setNewTaskEnd(e.target.value)}
                   required
                 />
               </div>
               <div>
                 <label className="block text-sm text-gray-400 mb-1">Dependencies (Pilih Task Sebelumnya)</label>
                 <div className="max-h-32 overflow-y-auto bg-gray-800 border border-gray-600 rounded p-2">
                   {tasks.length === 0 ? (
                     <div className="text-gray-500 text-sm italic">Belum ada task yang bisa dipilih</div>
                   ) : (
                     tasks.map(task => (
                       <label key={task.id} className="flex items-center gap-2 text-sm text-gray-300 py-1 cursor-pointer">
                         <input 
                           type="checkbox"
                           className="accent-blue-500 w-4 h-4"
                           checked={newTaskDependencies.includes(task.id)}
                           onChange={(e) => {
                             if (e.target.checked) {
                               setNewTaskDependencies([...newTaskDependencies, task.id]);
                             } else {
                               setNewTaskDependencies(newTaskDependencies.filter(id => id !== task.id));
                             }
                           }}
                         />
                         {task.name}
                       </label>
                     ))
                   )}
                 </div>
               </div>
               <div className="flex justify-end gap-3 mt-4">
                 <button 
                   type="button" 
                   onClick={() => setIsModalOpen(false)}
                   className="px-4 py-2 text-gray-400 hover:text-white"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit" 
                   disabled={isAdding}
                   className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                 >
                   {isAdding ? 'Adding...' : 'Save Task'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GanttChart;
