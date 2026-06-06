import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { fetchProjectSCurve } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  projectId: string;
}

const SCurveChart = ({ projectId }: Props) => {
  const [data, setData] = useState<{ planned: number[], actual: number[] } | null>(null);

  useEffect(() => {
    fetchProjectSCurve(projectId)
      .then(setData)
      .catch((err) => {
         console.error(err);
         setData(null);
      });
  }, [projectId]);

  if (!data) return <div className="text-gray-400 flex justify-center items-center h-full">Loading S-Curve...</div>;

  const labels = Array.from({ length: Math.max(data.planned.length, data.actual.length) }, (_, i) => `Month ${i + 1}`);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Planned Progress',
        data: data.planned,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderDash: [5, 5],
        tension: 0.4
      },
      {
        label: 'Actual Progress',
        data: data.actual,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { color: '#9CA3AF' },
        grid: { color: '#374151' }
      },
      x: {
        ticks: { color: '#9CA3AF' },
        grid: { color: '#374151' }
      }
    },
    plugins: {
      legend: { labels: { color: '#F3F4F6' } }
    }
  };

  return <Line data={chartData} options={options} />;
};

export default SCurveChart;
