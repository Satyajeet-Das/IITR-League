import React from "react";

const Winners = () => {
    return (
        <div
            className="flex flex-col items-center bg-gradient-to-b from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-lg max-w-5xl md:w-full shadow-2xl">
            {/* Title */}
            <div className="font-extrabold text-4xl text-purple-700 dark:text-purple-300 mb-12 tracking-widest">
                🏆 Winners Podium 🏆
            </div>

            {/* Podium */}
            <div className="flex items-end justify-center space-x-8">
                {/* Second Place */}
                <div className="flex flex-col items-center">
                    {/* Profile Image */}
                    <div
                        className="bg-gradient-to-b from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600 rounded-full h-20 w-20 overflow-hidden shadow-lg transform transition duration-300 hover:scale-105 mb-3">
                        <img
                            src="https://via.placeholder.com/150"
                            alt="Second Place"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    {/* Place and Badge */}
                    <span className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-1">2nd</span>
                    <div
                        className="h-16 w-24 bg-gradient-to-b from-sky-500 to-sky-400 dark:from-sky-700 dark:to-sky-600 flex items-center justify-center rounded-t-lg shadow-md">
                        <span className="text-2xl text-white font-extrabold">🥈</span>
                    </div>
                    {/* Points */}
                    <div
                        className="mt-3 bg-sky-100 text-sky-600 dark:bg-sky-800 dark:text-sky-300 text-sm font-semibold px-4 py-1 rounded-full shadow-sm">
                        Points: 85
                    </div>
                </div>

                {/* First Place */}
                <div className="flex flex-col items-center">
                    {/* Profile Image */}
                    <div
                        className="bg-gradient-to-b from-yellow-400 to-yellow-500 dark:from-yellow-600 dark:to-yellow-500 rounded-full h-24 w-24 overflow-hidden shadow-2xl transform transition duration-300 hover:scale-110 mb-3 border-4 border-yellow-600 dark:border-yellow-400">
                        <img
                            src="https://via.placeholder.com/150"
                            alt="First Place"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    {/* Place and Badge */}
                    <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-400 mb-1">1st</span>
                    <div
                        className="h-20 w-28 bg-gradient-to-b from-yellow-600 to-orange-500 dark:from-yellow-700 dark:to-orange-600 flex items-center justify-center rounded-t-lg shadow-xl">
                        <span className="text-3xl text-white font-extrabold">🥇</span>
                    </div>
                    {/* Points */}
                    <div
                        className="mt-3 bg-yellow-100 text-yellow-600 dark:bg-yellow-800 dark:text-yellow-300 text-sm font-semibold px-4 py-1 rounded-full shadow-sm">
                        Points: 100
                    </div>
                </div>

                {/* Third Place */}
                <div className="flex flex-col items-center">
                    {/* Profile Image */}
                    <div
                        className="bg-gradient-to-b from-red-400 to-red-500 dark:from-red-600 dark:to-red-500 rounded-full h-20 w-20 overflow-hidden shadow-lg transform transition duration-300 hover:scale-105 mb-3">
                        <img
                            src="https://via.placeholder.com/150"
                            alt="Third Place"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    {/* Place and Badge */}
                    <span className="text-2xl font-bold text-red-700 dark:text-red-400 mb-1">3rd</span>
                    <div
                        className="h-14 w-20 bg-gradient-to-b from-red-600 to-red-500 dark:from-red-700 dark:to-red-600 flex items-center justify-center rounded-t-lg shadow-md">
                        <span className="text-2xl text-white font-extrabold">🥉</span>
                    </div>
                    {/* Points */}
                    <div
                        className="mt-3 bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-300 text-sm font-semibold px-4 py-1 rounded-full shadow-sm">
                        Points: 75
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Winners;
