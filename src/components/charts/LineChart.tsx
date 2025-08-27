import React from 'react';

interface DataPoint {
  date: string;
  [key: string]: string | number;
}

interface LineChartProps {
  data: DataPoint[];
  lines: Array<{
    key: string;
    color: string;
    name: string;
  }>;
  height?: number;
  title?: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, lines, height = 300, title }) => {
  if (!data.length) return <div>No data available</div>;

  const maxValue = Math.max(
    ...data.flatMap(d => lines.map(line => Number(d[line.key]) || 0))
  );
  const minValue = Math.min(
    ...data.flatMap(d => lines.map(line => Number(d[line.key]) || 0))
  );

  const chartHeight = height - 60;
  const chartWidth = 400;
  const padding = 40;

  const getX = (index: number) => padding + (index / (data.length - 1)) * (chartWidth - 2 * padding);
  const getY = (value: number) => chartHeight - padding - ((value - minValue) / (maxValue - minValue)) * (chartHeight - 2 * padding);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>}
      <svg width={chartWidth} height={height} className="w-full">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(percent => {
          const y = padding + (percent / 100) * (chartHeight - 2 * padding);
          return (
            <line
              key={percent}
              x1={padding}
              y1={y}
              x2={chartWidth - padding}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth={1}
              opacity={0.3}
            />
          );
        })}

        {/* Lines */}
        {lines.map(line => {
          const pathData = data.map((d, i) => {
            const x = getX(i);
            const y = getY(Number(d[line.key]) || 0);
            return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
          }).join(' ');

          return (
            <path
              key={line.key}
              d={pathData}
              stroke={line.color}
              strokeWidth={2}
              fill="none"
            />
          );
        })}

        {/* Data points */}
        {lines.map(line => 
          data.map((d, i) => (
            <circle
              key={`${line.key}-${i}`}
              cx={getX(i)}
              cy={getY(Number(d[line.key]) || 0)}
              r={3}
              fill={line.color}
            />
          ))
        )}

        {/* X-axis labels */}
        {data.map((d, i) => {
          if (i % Math.ceil(data.length / 5) === 0) {
            return (
              <text
                key={i}
                x={getX(i)}
                y={chartHeight - 10}
                textAnchor="middle"
                fontSize="12"
                fill="#6b7280"
              >
                {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>
            );
          }
          return null;
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4">
        {lines.map(line => (
          <div key={line.key} className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: line.color }}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">{line.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LineChart;



