import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";
import { useTranslation } from "react-i18next";
import MapComponent from "./components/MapComponent";
import Bottomsheet from "./components/BottomSheet";
import DevAuthHelper from "./components/DevAuthHelper";
import SquircleLoader from "./components/SquircleLoader";

import authService from "./services/authService";
import useMainStore from "./store/MainStore";

import Homepage from "./pages/Homepage";
import ResourceMapping from "./pages/ResourceMapping";
import Groundwater from "./pages/Groundwater";
import SurfaceWaterBodies from "./pages/SurfaceWaterbodies";
import Agriculture from "./pages/Agriculture";
import Livelihood from "./pages/Livelihood";
import Agrohorticulture from "./pages/Agrohorticulture";
import InfoBox from "./components/InfoBox";

function App() {
    // Initializing authentication as the app starts to load
    const { initializeAuth, authLoading, isAuthenticated, user } =
        useMainStore();
    const [appReady, setAppReady] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        const initApp = async () => {
            await initializeAuth();
            setAppReady(true);
        };
        initApp();
    }, [initializeAuth]);

    if (!appReady || authLoading) {
        return (
            <div className="flex items-center justify-center w-screen h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="flex flex-col items-center space-y-4">
                    <SquircleLoader
                        size={50}
                        strokeWidth={5}
                        color="#667eea"
                        speed={1500}
                    />
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center w-screen h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="auth-error bg-white p-8 rounded-lg shadow-lg max-w-md mx-4 text-center">
                    <h2 className="text-xl font-semibold mb-4">
                        {t("Authentication not loaded")}
                    </h2>
                    <p className="mb-6 text-gray-600">
                        {t(
                            "Please re-submit the location from location selection screen to continue.",
                        )}
                    </p>
                    {import.meta.env.VITE_NODE_ENV === "development" && (
                        <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">
                                Development Mode: Use the "Dev Auth" button in
                                the top-right corner to paste your auth JSON
                            </p>
                        </div>
                    )}
                    <DevAuthHelper />
                </div>
            </div>
        );
    }

    return (
        <>
            <Toaster />
            <DevAuthHelper />
            <div className="absolute z-30">
                <Bottomsheet />
            </div>
            <div className="relative w-screen h-screen overflow-hidden z-0">
                <div className="absolute inset-0 z-0">
                    <MapComponent />
                </div>
                <div className="absolute inset-0 z-10 pointer-events-none">
                    <div className="pointer-events-auto">
                        <BrowserRouter>
                            <InfoBox />
                            <Routes>
                                <Route path="/maps" element={<Homepage />} />
                                <Route
                                    path="/resourcemapping"
                                    element={<ResourceMapping />}
                                />
                                <Route
                                    path="/groundwater"
                                    element={<Groundwater />}
                                />
                                <Route
                                    path="/surfaceWater"
                                    element={<SurfaceWaterBodies />}
                                />
                                <Route
                                    path="/agriculture"
                                    element={<Agriculture />}
                                />
                                <Route
                                    path="/livelihood"
                                    element={<Livelihood />}
                                />
                                <Route
                                    path="/agrohorticulture"
                                    element={<Agrohorticulture />}
                                />
                            </Routes>
                        </BrowserRouter>
                    </div>
                </div>
            </div>
        </>
    );
}

export default App;
