import React from 'react';

interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  title?: string;
  height?: number;
}

const BarChart: React.FC<BarChartProps> = ({ data, title, height = 300 }) => {
  if (!data.length) return <div>No data available</div>;

  const maxValue = Math.max(...data.map(d => d.value));
  const chartHeight = height - 60;
  const barWidth = 40;
  const spacing = 20;
  const chartWidth = data.length * (barWidth + spacing) + spacing;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>}
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={height}>
          {data.map((item, index) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            const x = spacing + index * (barWidth + spacing);
            const y = height - barHeight - 30;
            
            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={item.color || '#3B82F6'}
                  rx={4}
                />
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#374151"
                  className="dark:fill-gray-300"
                >
                  {item.value}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6B7280"
                  className="dark:fill-gray-400"
                >
                  {item.label.length > 8 ? item.label.substring(0, 8) + '...' : item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default BarChart;
