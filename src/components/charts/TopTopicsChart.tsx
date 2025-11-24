
import React from 'react';
import BookOpenIcon from '../icons/BookOpenIcon';

interface TopTopicsChartProps {
    data: { name: string; count: number }[];
}

const TopTopicsChart: React.FC<TopTopicsChartProps> = ({ data }) => {
    const maxCount = Math.max(...data.map(d => d.count), 1);

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col transition-colors duration-200">
            <div className="flex items-start space-x-4 mb-3">
                 <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-brand-blue rounded-lg text-white">
                    <BookOpenIcon className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Top 3 Topics</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">By Frequency</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">All Time</p>
                </div>
            </div>
            <div className="flex-grow flex flex-col justify-around space-y-2">
                {data.length > 0 ? (
                    data.map(({ name, count }) => (
                        <div key={name} className="flex items-center space-x-2">
                            <span className="text-sm text-gray-800 dark:text-gray-200 truncate w-2/5" title={name}>{name}</span>
                            <div className="flex-grow bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                                <div
                                    className="bg-brand-yellow dark:bg-yellow-500 h-4 rounded-full flex items-center justify-end pr-2"
                                    style={{ width: `${(count / maxCount) * 100}%` }}
                                    role="presentation"
                                >
                                </div>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white w-8 text-right">{count}</span>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 pt-4">No topic data available.</div>
                )}
            </div>
        </div>
    );
};

export default TopTopicsChart;