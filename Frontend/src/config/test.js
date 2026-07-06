const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND || "http://localhost:5000";

const fetchAllTestData = async () => {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/admin/packages`);
        if (!response.ok) throw new Error("Failed to fetch packages");
        const data = await response.json();
        return data.packages || [];
    } catch (error) {
        console.error('Error fetching holidays from backend:', error);
        return [];
    }
}

export { fetchAllTestData }