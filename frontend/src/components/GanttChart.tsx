import { useEffect, useState } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import type { Task as GanttTask } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { fetchProjectSchedule, addTask, editTask } from '../services/api';
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
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
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
          type: (t.type as 'task' | 'project' | 'milestone') || 'task',
          project: t.project,
          hideChildren: t.hideChildren,
          dependencies: t.dependencies || [],
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

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName || !newTaskStart || !newTaskEnd) return;
    setIsAdding(true);
    try {
      if (editingTaskId) {
        await editTask(projectId, editingTaskId, {
          name: newTaskName,
          start: newTaskStart,
          end: newTaskEnd,
          dependencies: newTaskDependencies
        });
      } else {
        await addTask(projectId, {
          name: newTaskName,
          start: newTaskStart,
          end: newTaskEnd,
          progress: 0,
          dependencies: newTaskDependencies
        });
      }
      
      // Reset form instead of closing modal so they can keep adding
      setEditingTaskId(null);
      setNewTaskName('');
      setNewTaskStart('');
      setNewTaskEnd('');
      setNewTaskDependencies([]);
      loadSchedule();
    } catch (err) {
      console.error(err);
      alert('Failed to save task');
    } finally {
      setIsAdding(false);
    }
  };

  const openAddModal = () => {
    setEditingTaskId(null);
    setNewTaskName('');
    setNewTaskStart('');
    setNewTaskEnd('');
    setNewTaskDependencies([]);
    setIsModalOpen(true);
  };

  const openEditModal = (task: GanttTask) => {
    setEditingTaskId(task.id);
    setNewTaskName(task.name);
    // Convert date back to YYYY-MM-DD
    setNewTaskStart(task.start.toISOString().split('T')[0]);
    setNewTaskEnd(task.end.toISOString().split('T')[0]);
    setNewTaskDependencies(task.dependencies || []);
  };

  const handleDateChange = async (task: GanttTask) => {
    setTasks(tasks.map(t => (t.id === task.id ? task : t)));
    try {
      await editTask(projectId, task.id, {
        start: task.start.toISOString().split('T')[0],
        end: task.end.toISOString().split('T')[0]
      });
    } catch(err) {
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setNewTaskName('');
    setNewTaskStart('');
    setNewTaskEnd('');
    setNewTaskDependencies([]);
  };

  const handleExpanderClick = (task: GanttTask) => {
    setTasks(tasks.map(t => (t.id === task.id ? { ...task, hideChildren: !task.hideChildren } : t)));
  };

  const CustomTaskListHeader: React.FC<{ headerHeight: number; rowWidth: string; fontFamily: string; fontSize: string; }> = ({ headerHeight, fontFamily, fontSize, rowWidth }) => {
    return (
      <div className="flex border-b border-gray-300 bg-gray-50 text-gray-700" style={{ height: headerHeight, fontFamily, fontSize, width: rowWidth }}>
        <div className="flex-1 flex items-center justify-center border-r border-gray-300 min-w-0 font-semibold px-2 text-center text-sm">Task name</div>
        <div className="w-24 flex items-center justify-center border-r border-gray-300 min-w-0 font-semibold px-2 text-center text-sm">Start time</div>
        <div className="w-16 flex items-center justify-center border-r border-gray-300 min-w-0 font-semibold px-2 text-center text-sm">Duration</div>
        <div className="w-8 flex items-center justify-center border-r border-gray-300 font-semibold text-center text-gray-400 text-sm">+</div>
      </div>
    );
  };

  const CustomTaskListTable: React.FC<{
    rowHeight: number;
    rowWidth: string;
    fontFamily: string;
    fontSize: string;
    locale: string;
    tasks: GanttTask[];
    selectedTaskId: string;
    setSelectedTask: (taskId: string) => void;
    onExpanderClick: (task: GanttTask) => void;
  }> = ({ rowHeight, rowWidth, tasks: visibleTasks, fontFamily, fontSize, onExpanderClick }) => {
    return (
      <div style={{ fontFamily, fontSize, width: rowWidth }} className="bg-white">
        {visibleTasks.map(t => {
          const duration = Math.ceil((t.end.getTime() - t.start.getTime()) / (1000 * 60 * 60 * 24));
          let indent = 0;
          let current = t;
          while (current.project) {
            indent++;
            // We search in the FULL tasks list to find parents reliably
            const parent = tasks.find(pt => pt.id === current.project);
            if (!parent) break;
            current = parent;
          }

          return (
            <div key={t.id} className="flex border-b border-gray-200 text-gray-800" style={{ height: rowHeight }}>
              <div className="flex-1 flex items-center border-r border-gray-200 min-w-0 px-2" style={{ paddingLeft: `${indent * 1.5 + 0.5}rem` }}>
                {t.type === 'project' ? (
                  <button className="mr-1 text-gray-400 hover:text-gray-600 text-xs" onClick={() => onExpanderClick(t)}>
                    {t.hideChildren ? '▶' : '▼'}
                  </button>
                ) : <span className="mr-4"></span>}
                <span className="truncate text-sm">{t.name}</span>
              </div>
              <div className="w-24 flex items-center justify-center border-r border-gray-200 min-w-0 px-2 text-center text-xs">
                {t.start.toISOString().split('T')[0]}
              </div>
              <div className="w-16 flex items-center justify-center border-r border-gray-200 min-w-0 px-2 text-center text-xs">
                {duration}
              </div>
              <div className="w-8 flex items-center justify-center border-r border-gray-200 text-gray-400 hover:bg-gray-100 cursor-pointer text-sm" onClick={() => openAddModal()}>
                +
              </div>
            </div>
          );
        })}
      </div>
    );
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
          onClick={openAddModal}
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={16} />
          Task Manager
        </button>
      </div>
      
      <div className="flex-1 overflow-auto">
        {tasks.length === 0 ? (
           <div className="text-gray-500 flex justify-center items-center h-full">No tasks available for this project.</div>
        ) : (
           <Gantt 
             tasks={tasks} 
             viewMode={viewMode} 
             listCellWidth="400px"
             TaskListHeader={CustomTaskListHeader}
             TaskListTable={CustomTaskListTable}
             onExpanderClick={handleExpanderClick}
             onDoubleClick={(task) => {
               openEditModal(task);
               setIsModalOpen(true);
             }}
             onDateChange={handleDateChange}
             onProgressChange={(task: GanttTask) => {
               setTasks(tasks.map(t => (t.id === task.id ? task : t)));
             }}
           />
        )}
      </div>

      {/* Task Manager Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-[900px] shadow-2xl text-white max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">Task Manager</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                 <X size={24} />
              </button>
            </div>
            
            {/* Existing Tasks Table */}
            <div className="mb-6 flex-1 overflow-y-auto border border-gray-700 rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-800 text-gray-300 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Task Name</th>
                    <th className="px-4 py-3">Start Date</th>
                    <th className="px-4 py-3">End Date</th>
                    <th className="px-4 py-3">Dependencies</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-gray-500 italic">No existing tasks yet.</td>
                    </tr>
                  )}
                  {tasks.map(t => (
                    <tr key={t.id} className="border-t border-gray-700 hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-3 font-medium">{t.name}</td>
                      <td className="px-4 py-3 text-gray-400">{t.start.toISOString().split('T')[0]}</td>
                      <td className="px-4 py-3 text-gray-400">{t.end.toISOString().split('T')[0]}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {t.dependencies && t.dependencies.length > 0 
                          ? tasks.filter(task => t.dependencies?.includes(task.id)).map(task => task.name).join(', ')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => openEditModal(t)}
                          className="text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Form */}
            <div className="border-t border-gray-700 pt-6">
              <h4 className="font-semibold mb-4 text-lg text-blue-400">
                {editingTaskId ? '✏️ Edit Task Details' : '➕ Add New Task'}
              </h4>
              <form onSubmit={handleSaveTask} className="grid grid-cols-2 gap-4">
                 <div className="col-span-2 sm:col-span-1">
                   <label className="block text-sm text-gray-400 mb-1">Task Name</label>
                   <input 
                     type="text" 
                     className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                     value={newTaskName}
                     onChange={(e) => setNewTaskName(e.target.value)}
                     required
                   />
                 </div>
                 
                 <div className="col-span-2 sm:col-span-1 row-span-3">
                   <label className="block text-sm text-gray-400 mb-1">Dependencies (Pilih Task Sebelumnya)</label>
                   <div className="h-40 overflow-y-auto bg-gray-800 border border-gray-600 rounded p-2">
                     {tasks.filter(t => t.id !== editingTaskId).length === 0 ? (
                       <div className="text-gray-500 text-sm italic p-2">Belum ada task lain yang bisa dipilih</div>
                     ) : (
                       tasks.filter(t => t.id !== editingTaskId).map(task => (
                         <label key={task.id} className="flex items-center gap-2 text-sm text-gray-300 py-1.5 px-2 hover:bg-gray-700 rounded cursor-pointer transition-colors">
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

                 <div className="col-span-2 sm:col-span-1">
                   <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                   <input 
                     type="date" 
                     className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                     value={newTaskStart}
                     onChange={(e) => setNewTaskStart(e.target.value)}
                     required
                   />
                 </div>

                 <div className="col-span-2 sm:col-span-1">
                   <label className="block text-sm text-gray-400 mb-1">End Date</label>
                   <input 
                     type="date" 
                     className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                     value={newTaskEnd}
                     onChange={(e) => setNewTaskEnd(e.target.value)}
                     required
                   />
                 </div>

                 <div className="col-span-2 flex justify-end gap-3 mt-2">
                   {editingTaskId && (
                     <button 
                       type="button" 
                       onClick={handleCancelEdit}
                       className="px-4 py-2 text-gray-400 hover:text-white"
                     >
                       Cancel Edit
                     </button>
                   )}
                   <button 
                     type="submit" 
                     disabled={isAdding}
                     className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                   >
                     {isAdding ? 'Saving...' : (editingTaskId ? 'Save Changes' : 'Add Task')}
                   </button>
                 </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GanttChart;
