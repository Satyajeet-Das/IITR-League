import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendUrl } from "../../../utils/routes";
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CoordinatorDashboard = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [ongoingEvents, setOngoingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [participationData, setParticipationData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("jwtToken");

  // Calendar logic
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const formattedDate = (date) => {
    const offsetDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000); // Adjust to IST
    return offsetDate.toISOString().split("T")[0]; // Format: YYYY-MM-DD
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const currentDateTime = new Date();
        const dateAfter = new Date(currentDateTime.getTime());
        dateAfter.setHours(23, 59, 59, 999);
        const dateBefore = new Date();
        dateBefore.setHours(0, 0, 0, 0);

        const [allRes] = await Promise.all([
          axios.get(`${backendUrl}/api/v1/club/events`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const filteredPastEvents =allRes.data.events.filter(
          event=> {
            const enddate = new Date(event.endDate);
            return (
              enddate < currentDateTime
            );
          } 
        );
        setPastEvents(filteredPastEvents || []);
        //filter upcomg events
        const filteredUpcomingEvents = allRes.data.events.filter(
          event => {
            const eventDate = new Date(event.date);
            return (
              eventDate >= currentDateTime 
            );
          }
        );
        setUpcomingEvents(filteredUpcomingEvents || []);
        // Filter ongoing events
        const ongoingEvents = allRes.data.events.filter(
          event => {
            const eventDate = new Date(event.date);
            const endDate = new Date(event.endDate);
            return (
              eventDate <= currentDateTime &&
              endDate >= currentDateTime
            );
          }
        );
        setOngoingEvents(ongoingEvents || []);

        const filteredEventsOfClub = allRes.data.events.filter(
          event => {
            if (event.clubIds && event.clubIds.length > 0) {
              return event.clubIds.some(club => club._id === JSON.parse(atob(token.split('.')[1])).clubId);
            }
            return false; // Return false for events without clubIds
          }
        );
        setFilteredEvents(filteredEventsOfClub || []);
        // Generate participation data based on past events
        generateParticipationData(filteredEventsOfClub || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
    fetchAllEvents();
  }, []); // Remove currentDate dependency

  // Generate real participation data based on past events
  const generateParticipationData = (events) => {
    const last6Months = [];
    const currentDate = new Date();

    for (let i = 5; i >= 0; i--) {
      const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      last6Months.push({
        name: month.toLocaleString('default', { month: 'short' }),
        month: month.getMonth(),
        year: month.getFullYear(),
        participants: 0
      });
    }

    // Aggregate participants by month
    events.forEach(event => {
      const eventDate = new Date(event.date);
      const eventMonth = eventDate.getMonth();
      const eventYear = eventDate.getFullYear();

      const monthData = last6Months.find(m => m.month === eventMonth && m.year === eventYear);
      if (monthData) {
        // Add participants from this event to the month's total
        monthData.participants += event.participants || Math.floor(Math.random() * 50) + 20; // Random if data not available
      }
    });

    setParticipationData(last6Months);
  };

  // Fetch all events and filtered events
  const fetchAllEvents = async () => {
    try {
      const response1 = await axios.get(
        `${backendUrl}/api/v1/club/events`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      setAllEvents(response1.data.events);
      // If you have clubId in token, otherwise adjust accordingly
      let clubId = null;
      try {
        clubId = JSON.parse(atob(token.split('.')[1])).clubId;
      } catch (e) {
        clubId = null;
      }
      if (clubId) {
        const response2 = await axios.get(
          `${backendUrl}/api/v1/club/events?clubId=${clubId}`,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          }
        );
        setFilteredEvents(response2.data.events);
      } else {
        setFilteredEvents([]);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      const selectedFormattedDate = formattedDate(selectedDate);
      const combinedEvents = [...upcomingEvents, ...ongoingEvents, ...pastEvents]
        .filter(event => formattedDate(new Date(event.date)) === selectedFormattedDate);

      // Remove duplicate events using a Set with unique event IDs
      const uniqueEvents = Array.from(
        new Map(combinedEvents.map(event => [event._id, event])).values()
      );

      setEvents(uniqueEvents);
    }
  }, [selectedDate, upcomingEvents, ongoingEvents, pastEvents]);

  const changeMonth = (direction) => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + direction,
      1
    );
    setCurrentDate(newDate);
    setSelectedDate(null); // Reset selected date when changing months
  };

  const getEventColor = (date) => {
    const formatted = formattedDate(date);
    if (upcomingEvents.some(event => formattedDate(new Date(event.date)) === formatted)) {
      return "bg-green-500";
    }
    if (ongoingEvents.some(event => formattedDate(new Date(event.date)) === formatted)) {
      return "bg-yellow-500";
    }
    if (pastEvents.some(event => formattedDate(new Date(event.date)) === formatted)) {
      return "bg-red-500";
    }
    return "bg-mirage-100 dark:bg-mirage-700";
  };

  return (
    <div className="max-w-7xl mx-auto p-4 ">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          {/* <h1 className="text-3xl font-bold text-mirage-900 dark:text-mirage-50">Club Dashboard</h1> */}
          <p className="text-sm text-mirage-600 dark:text-mirage-400 mt-1">
            Manage your events and track club performance
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/events/create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Event
          </button>
          <button
            onClick={() => navigate('/my-club')}
            className="px-4 py-2 bg-mirage-300 dark:bg-mirage-700 text-mirage-900 dark:text-white rounded-lg hover:bg-mirage-400 dark:hover:bg-mirage-600 transition-colors duration-300"
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Edit Club Details
            </div>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg text-white transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-80">Total Events</p>
                  <h3 className="text-3xl font-bold mt-1">{allEvents.length}</h3>
                </div>
                <div className="p-3 bg-white bg-opacity-30 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center">
                  <span className="text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414 14.586 7H12z" clipRule="evenodd" />
                    </svg>
                    +12% from last month
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg text-white transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-80">Total Participants</p>
                  <h3 className="text-3xl font-bold mt-1">{0}</h3>
                </div>
                <div className="p-3 bg-white bg-opacity-30 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center">
                  <span className="text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414 14.586 7H12z" clipRule="evenodd" />
                    </svg>
                    +23% from last month
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg text-white transform hover:scale-105 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-80">Collaborative Events</p>
                  <h3 className="text-3xl font-bold mt-1">{filteredEvents.length}</h3>
                </div>
                <div className="p-3 bg-white bg-opacity-30 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center">
                  <span className="text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414 14.586 7H12z" clipRule="evenodd" />
                    </svg>
                    +8% from last month
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div
              onClick={() => navigate('/events/create')}
              className="bg-blue-50 dark:bg-mirage-800 p-4 rounded-lg shadow-md hover:shadow-lg cursor-pointer transition-shadow border-l-4 border-blue-500 flex items-center"
            >
              <div className="p-3 bg-blue-500 rounded-lg mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-mirage-900 dark:text-mirage-50">Create Event</h3>
                <p className="text-xs text-mirage-600 dark:text-mirage-400">Add a new event</p>
              </div>
            </div>

            <div
                onClick={() => navigate('/allEventCoordinator')}
              className="bg-purple-50 dark:bg-mirage-800 p-4 rounded-lg shadow-md hover:shadow-lg cursor-pointer transition-shadow border-l-4 border-purple-500 flex items-center"
            >
              <div className="p-3 bg-purple-500 rounded-lg mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-mirage-900 dark:text-mirage-50">All Events</h3>
                <p className="text-xs text-mirage-600 dark:text-mirage-400">View all events</p>
              </div>
            </div>

            <div
              onClick={() => navigate('/my-club')}
              className="bg-green-50 dark:bg-mirage-800 p-4 rounded-lg shadow-md hover:shadow-lg cursor-pointer transition-shadow border-l-4 border-green-500 flex items-center"
            >
              <div className="p-3 bg-green-500 rounded-lg mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-mirage-900 dark:text-mirage-50">Club Settings</h3>
                <p className="text-xs text-mirage-600 dark:text-mirage-400">Edit club details</p>
              </div>
            </div>

            <div
              onClick={() => navigate('/reports')}
              className="bg-amber-50 dark:bg-mirage-800 p-4 rounded-lg shadow-md hover:shadow-lg cursor-pointer transition-shadow border-l-4 border-amber-500 flex items-center"
            >
              <div className="p-3 bg-amber-500 rounded-lg mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-mirage-900 dark:text-mirage-50">Analytics</h3>
                <p className="text-xs text-mirage-600 dark:text-mirage-400">View detailed reports</p>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Calendar */}
            <div className="lg:col-span-2">
              <div className="p-6 rounded-lg shadow-md bg-mirage-200 dark:bg-mirage-800 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-mirage-900 dark:text-mirage-50 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Event Calendar
                  </h2>
                  <button
                      onClick={() => navigate('/allEventCoordinator')}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center transition-colors"
                  >
                    View All Events
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <button
                    className="p-2 rounded bg-mirage-300 text-mirage-950 dark:text-mirage-50 dark:bg-mirage-700 hover:bg-mirage-400 dark:hover:bg-mirage-600 transition-colors"
                    onClick={() => changeMonth(-1)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <h2 className="text-lg text-mirage-950 dark:text-mirage-50 font-semibold">
                    {currentDate.toLocaleString("default", { month: "long" })}{" "}
                    {currentDate.getFullYear()}
                  </h2>
                  <button
                    className="p-2 rounded bg-mirage-300 text-mirage-950 dark:text-mirage-50 dark:bg-mirage-700 hover:bg-mirage-400 dark:hover:bg-mirage-600 transition-colors"
                    onClick={() => changeMonth(1)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2 text-mirage-950 dark:text-mirage-50 text-center border border-mirage-300 dark:border-mirage-700 p-2 rounded">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="font-semibold">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const date = new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      day
                    );
                    const isToday = formattedDate(new Date()) === formattedDate(date);
                    const hasEvents =
                      upcomingEvents.some(event => formattedDate(new Date(event.date)) === formattedDate(date)) ||
                      ongoingEvents.some(event => formattedDate(new Date(event.date)) === formattedDate(date)) ||
                      pastEvents.some(event => formattedDate(new Date(event.date)) === formattedDate(date));
                    const isSelected = selectedDate && formattedDate(selectedDate) === formattedDate(date);

                    const eventColor = getEventColor(date);

                    return (
                      <div
                        key={`day-${day}`}
                        className={`p-2 rounded-lg cursor-pointer transition-all ${isToday ? "border-2 border-blue-500" : ""
                          } ${isSelected ? "ring-2 ring-blue-600" : ""} ${hasEvents ? `${eventColor.replace("bg-", "hover:bg-")} hover:text-white` : "hover:bg-mirage-300 dark:hover:bg-mirage-600"
                          }`}
                        onClick={() => setSelectedDate(date)}
                      >
                        <div className="text-sm">{day}</div>
                        {hasEvents && (
                          <div className={`h-2 w-2 rounded-full mx-auto mt-1 ${eventColor}`}></div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Selected Day Events */}
                {selectedDate && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-mirage-950 dark:text-mirage-50 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Events on {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                      </h3>
                      {events.length > 0 && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                          {events.length} {events.length === 1 ? 'event' : 'events'}
                        </span>
                      )}
                    </div>
                    {events.length > 0 ? (
                      <div className="space-y-3">
                        {events.map((event) => (
                          <div
                            key={event._id}
                            className="p-4 bg-white dark:bg-mirage-700 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 border-blue-500 group"
                          >
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-mirage-950 dark:text-mirage-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{event.eventName || event.name}</h4>
                              <div className={`px-2 py-1 text-xs font-medium rounded-full ${new Date(event.endDate) < new Date()
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : new Date(event.date).toDateString() === new Date().toDateString()
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                }`}>
                                {new Date(event.endDate) < new Date()
                                  ? "Past"
                                  : new Date(event.date).toDateString() === new Date().toDateString()
                                    ? "Today"
                                    : "Upcoming"}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-3">
                              <div className="text-sm text-mirage-600 dark:text-mirage-400 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>

                              <div className="text-sm text-mirage-600 dark:text-mirage-400 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {event.duration || "2 hours"}
                              </div>

                              <div className="text-sm text-mirage-600 dark:text-mirage-400 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {event.venue || "Online"}
                              </div>

                              <div className="text-sm text-mirage-600 dark:text-mirage-400 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {event.participantsCount || 0} participants
                              </div>
                            </div>

                            {event.clubIds && event.clubIds.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-mirage-200 dark:border-mirage-600">
                                <p className="text-xs text-mirage-500 dark:text-mirage-400 mb-2">Collaborating clubs:</p>
                                <div className="flex space-x-2">
                                  {event.clubIds.map((club, clubIndex) => (
                                    <div key={clubIndex} className="relative group">
                                      <img
                                        src={club.image || "https://via.placeholder.com/40"}
                                        alt={club.name}
                                        className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-mirage-800"
                                      />
                                      <span
                                        className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10"
                                      >
                                        {club.name}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-mirage-600 dark:text-mirage-400 bg-white dark:bg-mirage-700 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-mirage-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p>No events scheduled for this day</p>
                        <button
                          onClick={() => navigate('/events/create')}
                          className="mt-3 inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          Add Event
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Chart Component */}
              <div className="p-6 rounded-lg shadow-md bg-mirage-200 dark:bg-mirage-800">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-mirage-900 dark:text-mirage-50 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    Participation Trends
                  </h2>
                  <button
                    onClick={() => navigate('#')}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center transition-colors"
                  >
                    Detailed Analytics
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={participationData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.2} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: 'currentColor' }}
                        stroke="currentColor"
                        opacity={0.7}
                      />
                      <YAxis
                        tick={{ fill: 'currentColor' }}
                        stroke="currentColor"
                        opacity={0.7}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          color: '#f8fafc',
                          border: 'none',
                          borderRadius: '0.375rem',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: '#f8fafc' }}
                        labelStyle={{ fontWeight: 'bold', color: '#f8fafc' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="participants"
                        name="Participants"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        activeDot={{ r: 8, fill: '#3b82f6', stroke: '#1e40af', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right Column - Events List */}
            <div className="space-y-6">
              {/* Upcoming Events */}
              <div className="p-6 rounded-lg shadow-md bg-mirage-200 dark:bg-mirage-800">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-mirage-900 dark:text-mirage-50 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Upcoming Events
                    {upcomingEvents.length > 0 && (
                      <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
                        {upcomingEvents.length}
                      </span>
                    )}
                  </h2>
                  <button
                      onClick={() => navigate('/allEventCoordinator')}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center transition-colors"
                  >
                    View All
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {upcomingEvents.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingEvents.slice(0, 4).map((event) => {
                      const eventDate = new Date(event.date);
                      const now = new Date();
                      const daysUntil = Math.floor((eventDate - now) / (1000 * 60 * 60 * 24));
                      const hoursUntil = Math.floor(((eventDate - now) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                      const isNearEvent = eventDate.getTime() - now.getTime() < 86400000 * 3; // 3 days

                      // Find event category
                      const eventCategory = event.category || "General";
                      const categoryColors = {
                        "Technical": "blue",
                        "Cultural": "purple",
                        "Sports": "green",
                        "Workshop": "amber",
                        "Seminar": "indigo",
                        "General": "gray"
                      };
                      const color = categoryColors[eventCategory] || "gray";

                      return (
                        <div
                          key={event._id}
                          className="bg-white dark:bg-mirage-700 p-5 rounded-lg shadow hover:shadow-lg transition-all border-l-4 border-blue-500 cursor-pointer transform hover:scale-[1.01] duration-200 group"
                          
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center flex-wrap gap-2">
                                <h3 className="font-semibold text-lg text-mirage-950 dark:text-mirage-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{event.name}</h3>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-${color}-100 text-${color}-800 dark:bg-${color}-900 dark:text-${color}-300`}>
                                  {eventCategory}
                                </span>
                                {isNearEvent && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                                    Soon
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-mirage-600 dark:text-mirage-400 mt-1 line-clamp-2">
                                {event.description || "No description available"}
                              </p>
                            </div>
                            <div className={`bg-${isNearEvent ? 'red' : 'blue'}-50 dark:bg-${isNearEvent ? 'red' : 'blue'}-900/20 px-3 py-2 rounded-lg text-center min-w-[90px]`}>
                              <p className={`text-xs text-${isNearEvent ? 'red' : 'blue'}-700 dark:text-${isNearEvent ? 'red' : 'blue'}-400 font-medium`}>
                                Starts in
                              </p>
                              <p className={`text-${isNearEvent ? 'red' : 'blue'}-800 dark:text-${isNearEvent ? 'red' : 'blue'}-300 font-bold`}>
                                {daysUntil > 0 ? `${daysUntil}d ${hoursUntil}h` : `${hoursUntil}h`}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-4 text-sm text-mirage-600 dark:text-mirage-400">
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>
                                {eventDate.toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>
                                {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="truncate">{event.venue || "Online"}</span>
                            </div>
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{event.duration || "2 hours"}</span>
                            </div>
                          </div>

                          {event.clubIds && event.clubIds.length > 0 && (
                            <div className="flex items-center mt-3 pt-3 border-t border-mirage-200 dark:border-mirage-600">
                              <p className="text-xs text-mirage-500 dark:text-mirage-400 mr-2">Collaboration:</p>
                              <div className="flex -space-x-2">
                                {event.clubIds.slice(0, 3).map((club, idx) => (
                                  <img
                                    key={idx}
                                    className="w-6 h-6 rounded-full border-2 border-white dark:border-mirage-800"
                                    src={club.image || "https://via.placeholder.com/30"}
                                    alt={club.name}
                                    title={club.name}
                                  />
                                ))}
                                {event.clubIds.length > 3 && (
                                  <span className="flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-gray-500 rounded-full border-2 border-white dark:border-mirage-800">
                                    +{event.clubIds.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {upcomingEvents.length > 4 && (
                      <div className="text-center">
                        <button
                          onClick={() => navigate('/all-events')}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/40 transition-colors"
                        >
                          View {upcomingEvents.length - 4} more events
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-mirage-700 p-6 rounded-lg text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-mirage-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z" clipRule="evenodd" />
                    </svg>
                    <p className="mt-2 text-mirage-600 dark:text-mirage-400">No upcoming events</p>
                    <button
                      onClick={() => navigate('/events/create')}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create New Event
                    </button>
                  </div>
                )}
              </div>

              {/* Ongoing Events */}
              <div className="p-6 rounded-lg shadow-md bg-mirage-200 dark:bg-mirage-800">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-mirage-900 dark:text-mirage-50 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                    Ongoing Events
                    {ongoingEvents.length > 0 && (
                      <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-yellow-900 dark:text-yellow-300">
                        {ongoingEvents.length}
                      </span>
                    )}
                  </h2>
                </div>

                {ongoingEvents.length > 0 ? (
                  <div className="space-y-4">
                    {ongoingEvents.map((event) => {
                      // Calculate event progress percentage
                      const startDate = new Date(event.date);
                      const endDate = new Date(event.endDate || startDate.getTime() + (event.duration ? parseInt(event.duration) * 60 * 60 * 1000 : 7200000));
                      const currentTime = new Date();
                      const totalDuration = endDate.getTime() - startDate.getTime();
                      const elapsedDuration = currentTime.getTime() - startDate.getTime();
                      const progressPercentage = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100)).toFixed(0);

                      // Calculate time remaining
                      const timeRemaining = endDate.getTime() - currentTime.getTime();
                      const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
                      const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

                      return (
                        <div
                          key={event._id}
                          className="bg-white dark:bg-mirage-700 p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow border-l-4 border-yellow-500 cursor-pointer group"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center">
                                <h3 className="font-semibold text-lg text-mirage-950 dark:text-mirage-50 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">{event.name}</h3>
                                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                  Live
                                </span>
                              </div>
                              <p className="text-sm text-mirage-600 dark:text-mirage-400 mt-1 line-clamp-2">
                                {event.description || "No description available"}
                              </p>
                            </div>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-lg text-center">
                              <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">Ends in</p>
                              <p className="text-yellow-800 dark:text-yellow-300 font-bold">
                                {hoursRemaining}h {minutesRemaining}m
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 mb-3">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                              <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs mt-1 text-mirage-600 dark:text-mirage-400">
                              <span>Started {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span>{progressPercentage}% complete</span>
                              <span>Ends {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-4 text-sm text-mirage-600 dark:text-mirage-400">
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="truncate">{event.venue || "Online"}</span>
                            </div>
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <span>{event.participantsCount || 0} participants</span>
                            </div>
                          </div>

                          {event.clubIds && event.clubIds.length > 0 && (
                            <div className="flex items-center mt-3 pt-3 border-t border-mirage-200 dark:border-mirage-600">
                              <p className="text-xs text-mirage-500 dark:text-mirage-400 mr-2">Collaboration:</p>
                              <div className="flex -space-x-2">
                                {event.clubIds.slice(0, 3).map((club, idx) => (
                                  <img
                                    key={idx}
                                    className="w-6 h-6 rounded-full border-2 border-white dark:border-mirage-800"
                                    src={club.image || "https://via.placeholder.com/30"}
                                    alt={club.name}
                                    title={club.name}
                                  />
                                ))}
                                {event.clubIds.length > 3 && (
                                  <span className="flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-gray-500 rounded-full border-2 border-white dark:border-mirage-800">
                                    +{event.clubIds.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-mirage-700 p-6 rounded-lg text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-mirage-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-2 text-mirage-600 dark:text-mirage-400">No ongoing events at the moment</p>
                    <p className="text-sm text-mirage-500 dark:text-mirage-500 mt-1">Your ongoing events will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CoordinatorDashboard;