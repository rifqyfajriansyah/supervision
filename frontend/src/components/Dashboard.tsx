import { useEffect, useState } from 'react';
import { fetchProjects } from '../services/api';
import type { Project } from '../services/api';
import MapComponent from './MapComponent';
import SCurveChart from './SCurveChart';
import GanttChart from './GanttChart';
import { Activity, Maximize2, X } from 'lucide-react';

type ViewType = 'map' | 'scurve' | 'gantt' | null;

const Dashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('7');
  const [expandedView, setExpandedView] = useState<ViewType>(null);

  useEffect(() => {
    fetchProjects().then(data => setProjects(data)).catch(console.error);
  }, []);

  return (
    <div className="p-6 h-screen flex flex-col bg-background text-white">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 bg-surface p-4 rounded-xl shadow-lg border border-gray-700">
        <div className="flex items-center gap-3">
          <Activity className="text-primary w-8 h-8" />
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Supervision Management System
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:outline-none"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </header>


      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">

        {/* Left Column: KPI & Map */}
        <div className="col-span-1 flex flex-col gap-6">
          <div className="bg-surface rounded-xl p-4 shadow-lg border border-gray-700 flex flex-col justify-center items-center">
            <h2 className="text-lg font-semibold text-gray-400 mb-2">Overall Progress</h2>
            <div className="text-5xl font-bold text-perform">72%</div>
            <p className="text-sm text-gray-500 mt-2">+4.5% vs last week</p>
          </div>
          <div className="flex-1 bg-surface rounded-xl p-4 shadow-lg border border-gray-700 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-300">Project Map</h2>
              <button onClick={() => setExpandedView('map')} className="text-gray-400 hover:text-white" title="Expand Map">
                <Maximize2 size={18} />
              </button>
            </div>
            <div className="flex-1 rounded-lg overflow-hidden border border-gray-600 relative">
              <MapComponent projects={projects} selectedId={selectedProjectId} />
            </div>
          </div>
        </div>

        {/* Right Column: S-Curve & Gantt */}
        <div className="col-span-2 flex flex-col gap-6">
          <div className="h-1/2 bg-surface rounded-xl p-4 shadow-lg border border-gray-700 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-300">Progress Comparison (S-Curve)</h2>
              <button onClick={() => setExpandedView('scurve')} className="text-gray-400 hover:text-white" title="Expand S-Curve">
                <Maximize2 size={18} />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <SCurveChart projectId={selectedProjectId} />
            </div>
          </div>
          <div className="h-1/2 bg-surface rounded-xl p-4 shadow-lg border border-gray-700 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-300">Project Schedule</h2>
              <button onClick={() => setExpandedView('gantt')} className="text-gray-400 hover:text-white" title="Expand Gantt Chart">
                <Maximize2 size={18} />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <GanttChart projectId={selectedProjectId} />
            </div>
          </div>
        </div>
      </div>

      {/* Expanded View Modal */}
      {expandedView && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center p-8">
          <div className="bg-surface border border-gray-700 rounded-xl shadow-2xl flex flex-col w-full h-full max-w-7xl max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                {expandedView === 'map' && 'Project Map (Detailed View)'}
                {expandedView === 'scurve' && 'Progress Comparison (S-Curve) (Detailed View)'}
                {expandedView === 'gantt' && 'Project Schedule (Detailed View)'}
              </h2>
              <button onClick={() => setExpandedView(null)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-6 relative">
               {expandedView === 'map' && <MapComponent projects={projects} selectedId={selectedProjectId} />}
               {expandedView === 'scurve' && <SCurveChart projectId={selectedProjectId} />}
               {expandedView === 'gantt' && <GanttChart projectId={selectedProjectId} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
