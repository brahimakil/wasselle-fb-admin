import React from 'react';

interface PieChartData {
  status: string;
  count: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  title?: string;
  size?: number;
}

const PieChart: React.FC<PieChartProps> = ({ data, title, size = 200 }) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  if (total === 0) return <div>No data available</div>;

  let currentAngle = 0;
  const center = size / 2;
  const radius = size / 2 - 20;

  const slices = data.map(item => {
    const percentage = (item.count / total) * 100;
    const angle = (item.count / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    const x1 = center + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    const y1 = center + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    const x2 = center + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    const y2 = center + radius * Math.sin((endAngle - 90) * Math.PI / 180);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${center} ${center}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    currentAngle += angle;
    
    return {
      ...item,
      pathData,
      percentage: percentage.toFixed(1)
    };
  });

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>}
      <div className="flex items-center space-x-6">
        <svg width={size} height={size}>
          {slices.map((slice, index) => (
            <path
              key={index}
              d={slice.pathData}
              fill={slice.color}
              stroke="#ffffff"
              strokeWidth={2}
            />
          ))}
        </svg>
        
        <div className="space-y-2">
          {slices.map((slice, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }}></div>
              <div className="text-sm">
                <span className="text-gray-900 dark:text-white font-medium">{slice.status}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">
                  {slice.count} ({slice.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PieChart;
