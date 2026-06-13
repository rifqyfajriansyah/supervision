import { useEffect, useState, useRef, useMemo } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import type { Task as GanttTask } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { fetchProjectSchedule, addTask, editTask, reorderTasks } from '../services/api';
import type { Task } from '../services/api';
import { Plus, X } from 'lucide-react';
import wbsData from '../data/wbsOptions.json';

const findWbsNode = (name: string, nodes: any[]): any | null => {
  if (!name) return null;
  for (const node of nodes) {
    if (node.name === name) return node;
    if (node.children && node.children.length > 0) {
      const found = findWbsNode(name, node.children);
      if (found) return found;
    }
  }
  return null;
};

const generateWBSMap = (tasks: GanttTask[]) => {
  const wbsMap: Record<string, string> = {};
  const byParent: Record<string, GanttTask[]> = {};
  const roots: GanttTask[] = [];

  tasks.forEach(t => {
    if (t.project) {
      if (!byParent[t.project]) byParent[t.project] = [];
      byParent[t.project].push(t);
    } else {
      roots.push(t);
    }
  });

  const assignWBS = (nodes: GanttTask[], prefix: string) => {
    nodes.forEach((node, index) => {
      const currentWBS = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
      wbsMap[node.id] = currentWBS;
      if (byParent[node.id]) {
        assignWBS(byParent[node.id], currentWBS);
      }
    });
  };

  assignWBS(roots, "");
  return wbsMap;
};

interface Props {
  projectId: string;
  isExpanded?: boolean;
}

const DependencyMultiSelect = ({ 
  tasks, 
  editingTaskId, 
  newTaskParent, 
  newTaskDependencies, 
  setNewTaskDependencies 
}: { 
  tasks: GanttTask[], 
  editingTaskId: string | null, 
  newTaskParent: string, 
  newTaskDependencies: string[], 
  setNewTaskDependencies: (deps: string[]) => void 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validDeps = tasks.filter(t => {
    if (t.id === editingTaskId) return false;
    return !newTaskParent ? !t.project : t.project === newTaskParent;
  });

  const selectedTasks = validDeps.filter(t => newTaskDependencies.includes(t.id));
  const availableTasks = validDeps.filter(t => !newTaskDependencies.includes(t.id) && t.name.toLowerCase().includes(search.toLowerCase()));

  const removeDep = (id: string) => {
    setNewTaskDependencies(newTaskDependencies.filter(depId => depId !== id));
  };

  const addDep = (id: string) => {
    setNewTaskDependencies([...newTaskDependencies, id]);
    setSearch('');
  };

  if (validDeps.length === 0) {
     return <div className="text-gray-500 text-sm italic px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg">Tidak ada task setara yang tersedia.</div>;
  }

  return (
    <div className="relative flex-1" ref={wrapperRef}>
      <div 
        className="min-h-[42px] w-full bg-gray-800 border border-gray-600 rounded-lg p-1.5 flex flex-wrap gap-1.5 cursor-text focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all shadow-inner"
        onClick={() => setIsOpen(true)}
      >
        {selectedTasks.map(t => (
          <span key={t.id} className="bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2 py-1 rounded text-xs flex items-center gap-1.5 font-medium shadow-sm">
            {t.name}
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); removeDep(t.id); }} 
              className="hover:text-red-400 hover:bg-red-400/20 rounded-full p-0.5 transition-colors"
            >
              <X size={12}/>
            </button>
          </span>
        ))}
        <input 
          type="text" 
          className="flex-1 bg-transparent min-w-[120px] text-sm text-gray-200 px-1 py-0.5 outline-none"
          placeholder={selectedTasks.length === 0 ? "Cari task..." : ""}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-gray-700 border border-gray-600 rounded-lg shadow-2xl z-50 py-1">
          {availableTasks.length > 0 ? (
            availableTasks.map(t => (
              <div 
                key={t.id} 
                className="px-3 py-2.5 text-sm text-gray-200 hover:bg-blue-600 cursor-pointer transition-colors"
                onClick={() => addDep(t.id)}
              >
                {t.name}
              </div>
            ))
          ) : (
            <div className="px-3 py-3 text-sm text-gray-400 italic text-center">
              {search ? "Task tidak ditemukan" : "Semua task sudah dipilih"}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TaskNameCombobox = ({
  value,
  onChange,
  options,
  placeholder = "e.g. Phase 1",
  theme = "dark"
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  theme?: "dark" | "light";
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isExactMatch = options.includes(value);
  const filteredOptions = isExactMatch 
    ? options 
    : options.filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
  const isDark = theme === "dark";

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isDark 
            ? "bg-gray-800 border-gray-600 text-white" 
            : "bg-white border-gray-300 text-gray-800"
        }`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={(e) => {
          setIsOpen(true);
          e.target.select();
        }}
        required={isDark}
      />
      {isOpen && options.length > 0 && (
        <div className={`absolute z-50 w-full mt-1 border rounded-md shadow-lg max-h-60 overflow-auto ${
          isDark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"
        }`}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => (
              <div
                key={idx}
                className={`px-3 py-2 cursor-pointer text-sm ${
                  isDark ? "text-white hover:bg-blue-600" : "text-gray-800 hover:bg-blue-50"
                }`}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
              >
                {opt}
              </div>
            ))
          ) : (
            <div className={`px-3 py-2 text-sm italic ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Ketik untuk custom text...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const InlineAddPopover = ({ 
  parentId, 
  onClose, 
  onSave, 
  isAdding,
  suggestedOptions 
}: { 
  parentId: string, 
  onClose: () => void, 
  onSave: (parentId: string, data: {name: string, start: string, end: string}) => void, 
  isAdding: boolean,
  suggestedOptions: string[]
}) => {
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  return (
    <div 
      className="w-72 bg-white border border-gray-200 shadow-2xl rounded-xl p-4 text-left cursor-default"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-gray-800 text-sm">Add Sub-task</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Task Name</label>
          <TaskNameCombobox 
            value={name}
            onChange={setName}
            options={suggestedOptions}
            theme="light"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Start</label>
            <input 
              type="date" 
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">End</label>
            <input 
              type="date" 
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        </div>
        <button 
          onClick={() => onSave(parentId, { name, start, end })}
          disabled={!name || !start || !end || isAdding}
          className="mt-2 w-full bg-blue-600 text-white rounded py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isAdding ? 'Saving...' : 'Save Task'}
        </button>
      </div>
    </div>
  );
};

const GanttChart = ({ projectId, isExpanded = false }: Props) => {
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal & Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskStart, setNewTaskStart] = useState('');
  const [newTaskEnd, setNewTaskEnd] = useState('');
  const [newTaskDependencies, setNewTaskDependencies] = useState<string[]>([]);
  const [newTaskParent, setNewTaskParent] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Day);
  const [minStartDate, setMinStartDate] = useState('');
  
  // Inline Popover states
  const [inlineAddParentId, setInlineAddParentId] = useState<string | null>(null);
  const [inlinePopoverPos, setInlinePopoverPos] = useState<{top: number, left: number} | null>(null);

  const wbsMap = useMemo(() => generateWBSMap(tasks), [tasks]);

  useEffect(() => {
    if (newTaskDependencies.length > 0) {
      let maxDate = new Date(0);
      newTaskDependencies.forEach(depId => {
        const depTask = tasks.find(t => t.id === depId);
        if (depTask && depTask.end > maxDate) {
          maxDate = depTask.end;
        }
      });
      if (maxDate.getTime() > 0) {
        const minStr = maxDate.toISOString().split('T')[0];
        setMinStartDate(minStr);
        if (!newTaskStart || new Date(newTaskStart) < maxDate) {
          setNewTaskStart(minStr);
        }
      } else {
        setMinStartDate('');
      }
    } else {
      setMinStartDate('');
    }
  }, [newTaskDependencies, tasks]);

  useEffect(() => {
    if (newTaskStart && newTaskEnd && new Date(newTaskEnd) < new Date(newTaskStart)) {
      setNewTaskEnd(newTaskStart);
    }
  }, [newTaskStart, newTaskEnd]);

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
          dependencies: newTaskDependencies,
          project: newTaskParent || undefined
        });
      } else {
        await addTask(projectId, {
          name: newTaskName,
          start: newTaskStart,
          end: newTaskEnd,
          progress: 0,
          dependencies: newTaskDependencies,
          project: newTaskParent || undefined
        });
      }
      
      // Reset form instead of closing modal so they can keep adding
      setEditingTaskId(null);
      setNewTaskName('');
      setNewTaskStart('');
      setNewTaskEnd('');
      setNewTaskDependencies([]);
      setNewTaskParent('');
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
    setNewTaskParent('');
    setIsModalOpen(true);
  };

  const moveTask = async (task: GanttTask, direction: 'up' | 'down') => {
    const byParent: Record<string, GanttTask[]> = { root: [] };
    tasks.forEach(t => {
      const p = t.project || 'root';
      if (!byParent[p]) byParent[p] = [];
      byParent[p].push(t);
    });

    const p = task.project || 'root';
    const siblings = byParent[p];
    const idx = siblings.findIndex(t => t.id === task.id);
    
    if (direction === 'up' && idx > 0) {
      const temp = siblings[idx - 1];
      siblings[idx - 1] = siblings[idx];
      siblings[idx] = temp;
    } else if (direction === 'down' && idx < siblings.length - 1) {
      const temp = siblings[idx + 1];
      siblings[idx + 1] = siblings[idx];
      siblings[idx] = temp;
    } else {
      return;
    }

    const newTaskIds: string[] = [];
    const traverse = (parentId: string) => {
      const children = byParent[parentId] || [];
      for (const child of children) {
        newTaskIds.push(child.id);
        traverse(child.id);
      }
    };
    traverse('root');

    try {
      await reorderTasks(projectId, newTaskIds);
      loadSchedule();
    } catch (err) {
      console.error(err);
      alert('Failed to reorder');
    }
  };

  const openEditModal = (task: GanttTask) => {
    setEditingTaskId(task.id);
    setNewTaskName(task.name);
    // Convert date back to YYYY-MM-DD
    setNewTaskStart(task.start.toISOString().split('T')[0]);
    setNewTaskEnd(task.end.toISOString().split('T')[0]);
    setNewTaskDependencies(task.dependencies || []);
    setNewTaskParent(task.project || '');
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
    setNewTaskParent('');
  };

  const handleExpanderClick = (task: GanttTask) => {
    setTasks(prevTasks => prevTasks.map(t => (t.id === task.id ? { ...t, hideChildren: !t.hideChildren } : t)));
  };

  const handleInlineSave = async (parentId: string, data: {name: string, start: string, end: string}) => {
    setIsAdding(true);
    try {
      await addTask(projectId, {
        name: data.name,
        start: data.start,
        end: data.end,
        progress: 0,
        dependencies: [],
        project: parentId
      });
      setInlineAddParentId(null);
      loadSchedule();
    } catch (err) {
      console.error(err);
      alert('Failed to save inline task');
    } finally {
      setIsAdding(false);
    }
  };

  const CustomTaskListHeader: React.FC<{ headerHeight: number; rowWidth: string; fontFamily: string; fontSize: string; }> = ({ headerHeight, fontFamily, fontSize, rowWidth }) => {
    return (
      <div className="flex border-b border-gray-300 bg-gray-50 text-gray-700" style={{ height: headerHeight, fontFamily, fontSize, width: rowWidth }}>
        <div className="flex-1 flex items-center justify-center border-r border-gray-300 min-w-0 font-semibold px-2 text-center text-sm">Task name</div>
        <div className="w-24 flex items-center justify-center border-r border-gray-300 min-w-0 font-semibold px-2 text-center text-sm">Start time</div>
        <div className="w-24 flex items-center justify-center border-r border-gray-300 min-w-0 font-semibold px-2 text-center text-sm">End time</div>
        <div className="w-16 flex items-center justify-center border-r border-gray-300 min-w-0 font-semibold px-2 text-center text-sm">Duration</div>
        {isExpanded && <div className="w-8 flex items-center justify-center border-r border-gray-300 font-semibold text-center text-gray-400 text-sm">+</div>}
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
              <div 
                className={`flex-1 flex items-center border-r border-gray-200 min-w-0 px-2 ${t.type === 'project' ? 'cursor-pointer hover:bg-gray-50' : ''}`} 
                style={{ paddingLeft: `${indent * 1.5 + 0.5}rem` }}
                onClick={(e) => {
                  if (t.type === 'project') {
                    e.stopPropagation();
                    onExpanderClick(t);
                  }
                }}
              >
                {t.type === 'project' ? (
                  <span className="mr-1 text-gray-400 text-xs">
                    {t.hideChildren ? '▶' : '▼'}
                  </span>
                ) : <span className="mr-4"></span>}
                <span className="truncate text-sm">{wbsMap[t.id] ? `${wbsMap[t.id]} ` : ''}{t.name}</span>
              </div>
              <div className="w-24 flex items-center justify-center border-r border-gray-200 min-w-0 px-2 text-center text-xs">
                {t.start.toISOString().split('T')[0]}
              </div>
              <div className="w-24 flex items-center justify-center border-r border-gray-200 min-w-0 px-2 text-center text-xs">
                {t.end.toISOString().split('T')[0]}
              </div>
              <div className="w-16 flex items-center justify-center border-r border-gray-200 min-w-0 px-2 text-center text-xs">
                {duration}
              </div>
              {isExpanded && (
                <div className="w-8 flex justify-center border-r border-gray-200 text-gray-400 text-sm relative">
                  <div 
                    className="w-full h-full flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (inlineAddParentId === t.id) {
                         setInlineAddParentId(null);
                         setInlinePopoverPos(null);
                      } else {
                         setInlineAddParentId(t.id);
                         const rect = e.currentTarget.getBoundingClientRect();
                         setInlinePopoverPos({ top: rect.bottom + 4, left: rect.right - 288 }); // 288 is w-72 approx
                      }
                    }}
                  >
                    +
                  </div>
                </div>
              )}
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
        {isExpanded && (
          <button 
            onClick={openAddModal}
            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Task Manager
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-auto">
        {tasks.length === 0 ? (
           <div className="text-gray-500 flex justify-center items-center h-full">No tasks available for this project.</div>
        ) : (
           <Gantt 
             tasks={tasks} 
             viewMode={viewMode} 
             listCellWidth={isExpanded ? "500px" : "468px"}
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

      {/* Render Inline Popover using fixed positioning to avoid clipping */}
      {inlineAddParentId && inlinePopoverPos && (() => {
        const inlineParentTask = tasks.find(t => t.id === inlineAddParentId);
        const inlineParentName = inlineParentTask?.name || '';
        const inlineWbsNode = inlineParentName ? findWbsNode(inlineParentName, wbsData) : { children: wbsData };
        const inlineOptions = (inlineWbsNode?.children || []).map((c: any) => c.name);

        return (
          <div 
            style={{ position: 'fixed', top: inlinePopoverPos.top, left: inlinePopoverPos.left, zIndex: 10000 }}
          >
            <InlineAddPopover 
              parentId={inlineAddParentId}
              onClose={() => {
                setInlineAddParentId(null);
                setInlinePopoverPos(null);
              }}
              onSave={(parentId, data) => {
                handleInlineSave(parentId, data);
                setInlinePopoverPos(null);
              }}
              isAdding={isAdding}
              suggestedOptions={inlineOptions}
            />
          </div>
        );
      })()}

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
                  {tasks.map(t => {
                    let indent = 0;
                    let current = t;
                    while (current.project) {
                      indent++;
                      const parent = tasks.find(pt => pt.id === current.project);
                      if (!parent) break;
                      current = parent;
                    }

                    return (
                    <tr key={t.id} className="border-t border-gray-700 hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <div style={{ paddingLeft: `${indent * 1.5}rem` }} className="flex items-center gap-2">
                           <span className="text-gray-500 text-xs w-4 flex justify-center">
                             {t.type === 'project' ? '📁' : (indent > 0 ? '└─' : '📄')}
                           </span>
                           <span>{wbsMap[t.id] ? `${wbsMap[t.id]} ` : ''}{t.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{t.start.toISOString().split('T')[0]}</td>
                      <td className="px-4 py-3 text-gray-400">{t.end.toISOString().split('T')[0]}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {t.dependencies && t.dependencies.length > 0 
                          ? tasks.filter(task => t.dependencies?.includes(task.id)).map(task => task.name).join(', ')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => moveTask(t, 'up')}
                          className="text-gray-400 hover:text-white mr-2"
                          title="Move Up"
                        >
                          ↑
                        </button>
                        <button 
                          onClick={() => moveTask(t, 'down')}
                          className="text-gray-400 hover:text-white mr-4"
                          title="Move Down"
                        >
                          ↓
                        </button>
                        <button 
                          onClick={() => openEditModal(t)}
                          className="text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                    );
                  })}
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
                   {(() => {
                     const parentTask = tasks.find(t => t.id === newTaskParent);
                     const parentName = parentTask?.name || '';
                     const wbsNode = parentName ? findWbsNode(parentName, wbsData) : { children: wbsData };
                     const modalOptions = (wbsNode?.children || []).map((c: any) => c.name);
                     
                     return (
                       <TaskNameCombobox
                         value={newTaskName}
                         onChange={setNewTaskName}
                         options={modalOptions}
                         theme="dark"
                       />
                     );
                   })()}
                 </div>
                 
                 <div className="col-span-2 sm:col-span-1 row-span-4 flex flex-col">
                   <label className="block text-sm text-gray-400 mb-1">Dependencies (Cari Task Sebelumnya)</label>
                   <DependencyMultiSelect 
                     tasks={tasks}
                     editingTaskId={editingTaskId}
                     newTaskParent={newTaskParent}
                     newTaskDependencies={newTaskDependencies}
                     setNewTaskDependencies={setNewTaskDependencies}
                   />
                 </div>

                 <div className="col-span-2 sm:col-span-1">
                   <label className="block text-sm text-gray-400 mb-1">Parent Task (Induk)</label>
                   <select 
                     className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                     value={newTaskParent}
                     onChange={(e) => {
                       setNewTaskParent(e.target.value);
                       setNewTaskDependencies([]);
                     }}
                   >
                     <option value="">-- Root Task (Tidak Ada Parent) --</option>
                     {tasks.filter(t => t.id !== editingTaskId).map(t => {
                       let indent = 0;
                       let current = t;
                       while (current.project) {
                         indent++;
                         const parent = tasks.find(pt => pt.id === current.project);
                         if (!parent) break;
                         current = parent;
                       }
                       const prefix = "— ".repeat(indent);
                       return <option key={t.id} value={t.id}>{prefix}{wbsMap[t.id] ? `${wbsMap[t.id]} ` : ''}{t.name}</option>;
                     })}
                   </select>
                 </div>

                 <div className="col-span-2 sm:col-span-1">
                   <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                   <input 
                     type="date" 
                     className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                     value={newTaskStart}
                     min={minStartDate}
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
                     min={newTaskStart || minStartDate}
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
