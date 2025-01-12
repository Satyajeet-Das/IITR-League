import {
    ClipboardListIcon,
    UserGroupIcon,
    BellIcon,
    LogoutIcon,
    UserCircleIcon,
} from "@heroicons/react/outline";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom"; // Import useLocation
import {jwtDecode} from "jwt-decode";

const CoordinatorSidebar = ({ onToggle }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { isAuthenticated, setIsAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); // Get the current location
    const email = localStorage.getItem("emailCont");

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
        onToggle(!isCollapsed); // Notify the parent about the change
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
                    const currentTime = Date.now() / 1000; // Current time in seconds
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

        const interval = setInterval(checkAuthStatus, 10000); // Check every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const menuItems = [
        {
            icon: <UserGroupIcon className="h-6 w-6" />,
            label: "My Club",
            path: "/my-club",
        },
        {
            icon: <ClipboardListIcon className="h-6 w-6" />,
            label: "Manage Events",
            path: "/manage-events",
        },
        {
            icon: <BellIcon className="h-6 w-6" />,
            label: "Notifications",
            path: "/notifications",
        },
        {
            icon: <UserCircleIcon className="h-6 w-6" />,
            label: "My Profile",
            path: "/my-profile",
        },
    ];

    return (
        <div
            className={`fixed top-0 left-0 h-screen bg-gray-800 text-white ${isCollapsed ? "w-16" : "w-64"
                } transition-all duration-300 z-50`}
        >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4">
                {!isCollapsed && <span className="text-lg font-bold">Menu</span>}
                <button
                    className="p-2 rounded hover:bg-gray-700"
                    onClick={toggleSidebar}
                >
                    <span className="material-icons">
                        {isCollapsed ? "menu" : "close"}
                    </span>
                </button>
            </div>

            {/* Sidebar Menu */}
            <ul className="mt-6 space-y-2">
                {[
                    {
                        icon: <UserGroupIcon className="h-6 w-6" />,
                        label: "My Club",
                        path: "/home_club",
                    },
                    {
                        icon: <ClipboardListIcon className="h-6 w-6" />,
                        label: "Manage Events",
                        path: "/manage-events",
                    },
                    {
                        icon: <BellIcon className="h-6 w-6" />,
                        label: "Notifications",
                        path: "/notifications",
                    },
                    {
                        icon: <UserCircleIcon className="h-6 w-6" />,
                        label: "My Profile",
                        path: "/my-profile",
                    },
                ].map((item, idx) => (
                    <li
                        key={idx}
                        className={`flex items-center space-x-4 p-2 rounded cursor-pointer
                            ${location.pathname === item.path
                                ? "bg-blue-600 text-white shadow-md" // Active style
                                : "hover:bg-gray-700"
                            }`}
                        onClick={() => navigate(item.path)}
                    >
                        <span className="text-lg">{item.icon}</span>
                        {!isCollapsed && <span>{item.label}</span>}
                    </li>
                ))}
            </ul>

            {/* Log Out Button */}
            <div
                className="absolute bottom-4 flex items-center p-2 hover:bg-gray-700 rounded cursor-pointer"
                onClick={handleLogout}
            >
                <LogoutIcon className="h-6 w-6" />
                {!isCollapsed && <span className="ml-4">Log Out</span>}
            </div>
        </div>
    );
};

export default CoordinatorSidebar;
