import React, { useState } from "react";
import authService from "../services/authService";
import useMainStore from "../store/MainStore";

const DevAuthHelper = () => {
    const [authData, setAuthData] = useState("");
    const [isVisible, setIsVisible] = useState(false);
    const { initializeAuth } = useMainStore();

    if (import.meta.env.VITE_NODE_ENV !== "development") {
        return null;
    }

    const handleSetAuth = async () => {
        try {
            const parsedAuth = JSON.parse(authData);
            authService.setDevAuthData(parsedAuth);
            await initializeAuth(); // Refresh the app state
            alert("Auth data set successfully!");
        } catch (error) {
            alert("Invalid JSON format");
        }
    };

    const handleClearAuth = async () => {
        authService.clearDevAuthData();
        await initializeAuth(); // Refresh the app state
        alert("Auth data cleared!");
    };

    const useMockAuth = () => {
        const mockData = {
            access_token: "dev_token_123",
            refresh_token: "dev_refresh_123",
            user: {
                id: 1,
                first_name: "Developer",
                last_name: "User",
                email: "dev@example.com",
                organization_name: "Dev Organization",
                is_superadmin: true,
            },
        };
        authService.setDevAuthData(mockData);
        initializeAuth();
        alert("Mock auth data set!");
    };

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                className="fixed top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded text-sm z-50"
            >
                Dev Auth
            </button>
        );
    }

    return (
        <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-md">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold">Development Auth Helper</h3>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-gray-500 hover:text-gray-700"
                >
                    ✕
                </button>
            </div>

            <div className="space-y-3">
                <button
                    onClick={useMockAuth}
                    className="w-full bg-green-500 text-white px-3 py-2 rounded text-sm"
                >
                    Use Mock Auth Data
                </button>

                <textarea
                    value={authData}
                    onChange={(e) => setAuthData(e.target.value)}
                    placeholder="Paste auth JSON from Postman here..."
                    className="w-full h-32 border border-gray-300 rounded p-2 text-xs"
                />

                <div className="flex space-x-2">
                    <button
                        onClick={handleSetAuth}
                        className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm"
                    >
                        Set Auth Data
                    </button>
                    <button
                        onClick={handleClearAuth}
                        className="flex-1 bg-red-500 text-white px-3 py-2 rounded text-sm"
                    >
                        Clear Auth
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DevAuthHelper;
