import {
    HomeIcon,
    ChartSquareBarIcon,
    SparklesIcon,
    BellIcon,
    CogIcon,
    LogoutIcon,
    UserGroupIcon,
    UserCircleIcon,
    StarIcon,
    ClipboardCheckIcon,
    ViewListIcon,
    ArchiveIcon
} from "@heroicons/react/outline";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom"; 
import { jwtDecode } from "jwt-decode";
import Tooltip from '../utils/Tooltip_sidebar'; 

const Sidebar = ({ onToggle }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { isAuthenticated, setIsAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); 
    const email = localStorage.getItem("emailCont");

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
        onToggle(!isCollapsed); 
    };

    const handleLogout = () => {
        localStorage.removeItem("authToken");
        setIsAuthenticated(false);
        navigate("/");
    };

    useEffect(() => {
        const checkAuthStatus = () => {
            const token = localStorage.getItem("authToken");
            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    const currentTime = Date.now() / 1000; 
                    if (decoded.exp > currentTime) {
                        setIsAuthenticated(true);
                    } else {
                        localStorage.removeItem("authToken");
                        setIsAuthenticated(false);
                    }
                } catch (error) {
                    localStorage.removeItem("authToken");
                    setIsAuthenticated(false);
                }
            } else {
                setIsAuthenticated(false);
            }
        };

        checkAuthStatus();

        const interval = setInterval(checkAuthStatus, 10000); 
        return () => clearInterval(interval);
    }, []);

    const menuItems = [
        { icon: <HomeIcon className="h-6 w-6" />, label: "Home", path: "/home" },
        { icon: <UserGroupIcon className="h-6 w-6" />, label: "All Clubs", path: "/clubs" },
        { icon: <ClipboardCheckIcon className="h-6 w-6" />, label: "My Events", path: "/my-events" },
        { icon: <ArchiveIcon className="h-6 w-6" />, label: "All Events", path: "/all-events" },
        { icon: <SparklesIcon className="h-6 w-6" />, label: "My Batch Leaderboard", path: "/batch-leaderboard" },
        { icon: <StarIcon className="h-6 w-6" />, label: "Overall Leaderboard", path: "/overall-leaderboard" },
        { icon: <ChartSquareBarIcon className="h-6 w-6" />, label: "My Achievements", path: "/my-achievements" },
        { icon: <UserCircleIcon className="h-6 w-6" />, label: "My Profile", path: "/profile" },
    ];

    // Handle window resize to collapse sidebar on small screens
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 820) { 
                setIsCollapsed(true);
            } else {
                setIsCollapsed(false);
            }
        };

        window.addEventListener("resize", handleResize);
        handleResize(); // Call on mount to set initial state

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <div
            className={`fixed top-0 left-0 h-screen dark:bg-gray-800 dark:text-white bg-gray-200 text-gray-800 ${isCollapsed ? "w-16" : "w-64"} transition-all duration-300 z-50`}
        >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-2">
                    {!isCollapsed && (
                        <span className="text-lg font-bold">Leaderboard</span>
                    )}
                </div>
                <button
                    className="p-2 rounded hover:bg-gray-300 dark:hover:bg-gray-700"
                    onClick={toggleSidebar}
                >
                    <span className="material-icons">
                        {isCollapsed ? "menu" : "close"}
                    </span>
                </button>
            </div>

            {/* Sidebar Menu */}
            <ul className="mt-6 ml-3 space-y-2">
                {menuItems.map((item, idx) => (
                    <li
                        key={idx}
                        className={`flex items-center space-x-4 p-2 rounded cursor-pointer
                            ${location.pathname === item.path
                                ? "bg-blue-600 text-white shadow-md" // Active style
                                : "hover:bg-gray-300 dark:hover:bg-gray-700"
                            }`}
                        onClick={() => {
                            console.log("isAuthenticated ", isAuthenticated);
                            if (isAuthenticated === false) {
                                handleLogout();
                            }
                            navigate(item.path);
                        }}
                    >
                        <Tooltip text={item.label} show={isCollapsed}>
                            <span className="text-lg">{item.icon}</span>
                        </Tooltip>
                        {!isCollapsed && <span>{item.label}</span>}
                    </li>
                ))}
            </ul>

            {/* Sidebar Footer */}
            <div className="absolute bottom-4 ml-3">
                <ul className="space-y-2">
                    {[{
                        icon: <BellIcon className="h-6 w-6" />,
                        label: "Notifications",
                        path: "/notifications"
                    },
                    {
                        icon: <CogIcon className="h-6 w-6" />,
                        label: "Settings",
                        path: "/settings"
                    }].map((item, idx) => (
                        <li
                            key={idx}
                            className={`flex items-center space-x-4 p-2 rounded cursor-pointer
                                ${location.pathname === item.path
                                    ? "bg-blue-600 text-white shadow-md" // Active style
                                    : "hover:bg-gray-300 dark:hover:bg-gray-700"
                                }`}
                            onClick={() => navigate(item.path)}
                        >
                            <Tooltip text={item.label} show={isCollapsed}>
                                <span className="text-lg">{item.icon}</span>
                            </Tooltip>
                            {!isCollapsed && <span>{item.label}</span>}
                        </li>
                    ))}
                </ul>
                <div className="flex items-center mt-4 p-2 hover:bg-gray-300 dark:hover:bg-gray-700 rounded">
                    <div className="h-8 w-8 bg-gray-500 rounded-full"></div>
                    {!isCollapsed && (
                        <div className="ml-2">
                            <p className="text-sm">Brooklyn Simmons</p>
                            <p className="text-xs text-gray-400">
                                {email}
                            </p>
                        </div>
                    )}
                </div>
                {/* Log Out Button */}
                <div
                    className="flex items-center mt-4 p-2 hover:bg-gray-300 dark:hover:bg-gray-700 rounded cursor-pointer"
                    onClick={handleLogout}
                >
                     <Tooltip text="Log Out" show={isCollapsed}>
                    <LogoutIcon className="h-6 w-6" />
                </ Tooltip>
                    {!isCollapsed && <span className="ml-5">Log Out</span>}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;