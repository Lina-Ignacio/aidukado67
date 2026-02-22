import React from 'react';
import { MoonLoader } from "react-spinners";

const StatCard = ({ title, value, icon: Icon, color, loading = false }) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-4 flex items-center justify-between border border-gray-200">
            <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                {loading ? (
                    <MoonLoader color={color.replace('bg-', 'text-')} size={24} />
                ) : (
                    <p className="text-2xl font-bold text-gray-800">{value}</p>
                )}
            </div>
            <div className={`${color} p-3 rounded-full`}>
                <Icon className="text-white text-xl" />
            </div>
        </div>
    );
};

export default StatCard;