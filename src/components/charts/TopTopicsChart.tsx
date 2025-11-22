import React from 'react';
import BookOpenIcon from '../icons/BookOpenIcon';

interface TopTopicsChartProps {
    data: { name: string; count: number }[];
}

const TopTopicsChart: React.FC<TopTopicsChartProps> = ({ data }) => {
    const maxCount = Math.max(...data.map(d => d.count), 1);

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm h-full flex flex-col">
            <div className="flex items-start space-x-4 mb-3">
                 <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-brand-blue rounded-lg text-white">
                    <BookOpenIcon className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Top 3 Topics</p>
                    <p className="text-2xl font-bold text-gray-900">By Frequency</p>
                    <p className="text-xs text-gray-500">All Time</p>
                </div>
            </div>
            <div className="flex-grow flex flex-col justify-around space-y-2">
                {data.length > 0 ? (
                    data.map(({ name, count }) => (
                        <div key={name} className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 truncate w-2/5" title={name}>{name}</span>
                            <div className="flex-grow bg-gray-200 rounded-full h-4">
                                <div
                                    className="bg-brand-yellow h-4 rounded-full flex items-center justify-end pr-2"
                                    style={{ width: `${(count / maxCount) * 100}%` }}
                                    role="presentation"
                                >
                                </div>
                            </div>
                            <span className="text-sm font-semibold text-gray-800 w-8 text-right">{count}</span>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-500 pt-4">No topic data available.</div>
                )}
            </div>
        </div>
    );
};

export default TopTopicsChart;
