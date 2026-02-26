// hooks/useCurrentSemester.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useCurrentSemester = () => {
    const [currentSemester, setCurrentSemester] = useState(null);
    const [selectedSemesterId, setSelectedSemesterId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCurrentSemester = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/academic-semesters/get-current`);
            setCurrentSemester(response.data);
            if (response.data) {
                setSelectedSemesterId(response.data.id);
            }
        } catch (err) {
            setError(err.response?.data?.message || "No current semester set or error fetching");
            console.log("No current semester set or error fetching:", err);
            setCurrentSemester(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch on mount
    useEffect(() => {
        fetchCurrentSemester();
    }, [fetchCurrentSemester]);

    // Optional: Function to manually refresh
    const refreshCurrentSemester = useCallback(() => {
        fetchCurrentSemester();
    }, [fetchCurrentSemester]);

    // Optional: Function to clear/update selected semester
    const updateSelectedSemester = useCallback((semesterId) => {
        setSelectedSemesterId(semesterId);
    }, []);

    return {
        currentSemester,
        selectedSemesterId,
        loading,
        error,
        refreshCurrentSemester,
        updateSelectedSemester,
        setSelectedSemesterId // Direct setter if needed
    };
};

export default useCurrentSemester;