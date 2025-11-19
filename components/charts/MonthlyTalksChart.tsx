
import React from 'react';
import ClipboardListIcon from '../icons/ClipboardListIcon';

interface MonthlyTalksChartProps {
    data: { month: string; count: number }[];
}

const MonthlyTalksChart: React.FC<MonthlyTalksChartProps> = ({ data }) => {
    const maxCount = Math.max(...data.map(d => d.count), 1); // Avoid division by zero
    const totalTalks = data.reduce((sum, item) => sum + item.count, 0);

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col transition-colors duration-200">
            <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-brand-blue rounded-lg text-white">
                    <ClipboardListIcon className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Talks Activity</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTalks}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Over the last 6 months</p>
                </div>
            </div>
            <div className="flex-grow flex items-end justify-around mt-4 space-x-2 px-2" aria-label="Monthly talks chart">
                {data.map(({ month, count }) => (
                    <div key={month} className="flex flex-col items-center flex-1">
                        <div 
                            className="w-full bg-brand-blue dark:bg-blue-500 rounded-t-sm hover:bg-brand-blue-dark dark:hover:bg-blue-600 transition-colors"
                            style={{ height: `${(count / maxCount) * 100}%` }}
                            role="presentation"
                            title={`${month}: ${count} talk(s)`}
                        >
                            <span className="sr-only">{`${month}: ${count} talk(s)`}</span>
                        </div>
                        <span className="text-xs text-gray-700 dark:text-gray-300 mt-1">{month}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MonthlyTalksChart;