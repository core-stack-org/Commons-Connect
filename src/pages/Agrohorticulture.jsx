import { useState, useEffect } from "react";
import useMainStore from "../store/MainStore.jsx";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import getOdkUrlForScreen from "../action/getOdkUrl.js";
import getSiteSuitabilityBandValues from "../action/getSiteSuitabilityBandValues.js";
import getRasterValue from "../action/getRasterValue.js";

const Agrohorticulture = () => {
    const MainStore = useMainStore((state) => state);
    const navigate = useNavigate();
    const { t } = useTranslation();

    // State to track if valid suitability data exists at marker location
    const [hasSuitabilityData, setHasSuitabilityData] = useState(false);
    const [isCheckingData, setIsCheckingData] = useState(false);

    // Favorable terrain types: 4 = U-shape valleys, 5 = Broad Flat Areas, 6 = Broad open slopes, 7 = Flat tops
    const FAVORABLE_TERRAIN_VALUES = [4, 5, 6, 7];

    // Check if valid site suitability data exists when marker is placed
    useEffect(() => {
        const checkSuitabilityData = async () => {
            if (!MainStore.markerCoords || !MainStore.isMarkerPlaced) {
                setHasSuitabilityData(false);
                return;
            }

            setIsCheckingData(true);
            const [lon, lat] = MainStore.markerCoords;
            const districtName = MainStore.districtName?.toLowerCase();
            const blockName = MainStore.blockName?.toLowerCase();

            if (!districtName || !blockName) {
                setHasSuitabilityData(false);
                setIsCheckingData(false);
                return;
            }

            try {
                // Check both suitability score and terrain value in parallel
                const [bandValues, terrainValue] = await Promise.all([
                    getSiteSuitabilityBandValues(districtName, blockName, lon, lat),
                    getRasterValue("terrain", `${districtName}_${blockName}_terrain_raster`, lon, lat)
                ]);

                // Check if terrain is in favorable area (not black/masked)
                const terrainNum = terrainValue !== null ? Math.round(terrainValue) : null;
                const isValidTerrain = terrainNum !== null && FAVORABLE_TERRAIN_VALUES.includes(terrainNum);

                // Check if we got valid suitability data with a valid score (1-5)
                const hasValidScore = bandValues &&
                    bandValues["Site Suitability Score"] !== undefined &&
                    Math.round(bandValues["Site Suitability Score"]) >= 1 &&
                    Math.round(bandValues["Site Suitability Score"]) <= 5;

                // Only enable button if both terrain and suitability are valid
                setHasSuitabilityData(isValidTerrain && hasValidScore);

                if (!isValidTerrain) {
                    console.log("Terrain value not in favorable range:", terrainNum);
                }
                if (!hasValidScore) {
                    console.log("Suitability score not valid:", bandValues?.["Site Suitability Score"]);
                }
            } catch (error) {
                console.error("Error checking suitability data:", error);
                setHasSuitabilityData(false);
            }

            setIsCheckingData(false);
        };

        checkSuitabilityData();
    }, [MainStore.markerCoords, MainStore.isMarkerPlaced, MainStore.districtName, MainStore.blockName]);

    const getPlanLabel = () => {
        const plan = MainStore.currentPlan?.plan ?? t("Select Plan");

        // Helper function to capitalize each word
        const capitalizeWords = (str) => {
            return str
                .split(" ")
                .map(
                    (word) =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase(),
                )
                .join(" ");
        };

        const capitalizedPlan = capitalizeWords(plan);
        if (capitalizedPlan.length > 15) {
            return capitalizedPlan.slice(0, 13) + "..";
        }
        return capitalizedPlan;
    };

    // Function to open ODK form with marker coordinates
    const toggleFormsUrl = () => {
        let gpsCoords = MainStore.gpsLocation;

        if (gpsCoords === null) {
            try {
                navigator.geolocation.getCurrentPosition(
                    ({ coords }) => {
                        gpsCoords = [coords.longitude, coords.latitude];
                    },
                    (err) => {
                        console.log("GPS error: ", err);
                    },
                );
                if (gpsCoords === null) {
                    throw new Error("User location missing");
                }
            } catch (e) {
                console.log("Geolocation catch");
            }
            MainStore.setGpsLocation(gpsCoords);
        }

        if (!MainStore.markerCoords) {
            toast.error(t("Please place a marker first"));
            return;
        }

        if (!MainStore.currentPlan) {
            toast.error(t("Please select a plan first"));
            return;
        }

        const formUrl = getOdkUrlForScreen(
            MainStore.currentScreen,
            MainStore.currentStep,
            MainStore.markerCoords,
            MainStore.settlementName,
            "",
            MainStore.blockName,
            MainStore.currentPlan.plan_id,
            MainStore.currentPlan.plan,
            "",
            false,
            gpsCoords,
        );

        MainStore.setIsForm(true);
        MainStore.setFormUrl(formUrl);
        MainStore.setIsOpen(true);
    };

    return (
        <>
            {/* Title Bubble */}
            <div className="absolute top-4 left-0 w-full px-4 z-10 pointer-events-none">
                <div className="relative w-full max-w-lg mx-auto flex items-center">
                    <div className="flex-1 px-6 py-3 text-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-extrabold text-md shadow-md">
                        {t("Agrohorticulture")}
                    </div>
                </div>
            </div>

            {/* 2. Top-left buttons */}
            <div className="absolute top-20 left-0 w-full px-4 z-10 flex justify-start pointer-events-auto">
                <div className="flex gap-4 max-w-lg">
                    <div className="flex flex-col gap-3">
                        {/* GPS Button */}
                        <button
                            className="flex-shrink-0 w-9 h-9 rounded-md shadow-sm flex items-center justify-center"
                            style={{
                                backgroundColor: "#D6D5C9",
                                color: "#592941",
                                border: "none",
                                backdropFilter: "none",
                            }}
                            onClick={() => {
                                MainStore.setIsGPSClick(!MainStore.isGPSClick);
                            }}
                        >
                            <svg
                                viewBox="-16 0 130 130"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <ellipse
                                    cx="50"
                                    cy="130"
                                    rx="18"
                                    ry="6"
                                    fill="#00000010"
                                />
                                <path
                                    d="M50 20 C70 20 85 35 85 55 C85 75 50 110 50 110 C50 110 15 75 15 55 C15 35 30 20 50 20 Z"
                                    fill="#592941"
                                    stroke="#592941"
                                    strokeWidth="1.5"
                                />
                                <circle
                                    cx="50"
                                    cy="55"
                                    r="16"
                                    fill="#FFFFFF"
                                    stroke="#1E40AF"
                                    strokeWidth="1.5"
                                />
                                <circle cx="50" cy="55" r="6" fill="#592941" />
                                <ellipse
                                    cx="46"
                                    cy="38"
                                    rx="6"
                                    ry="10"
                                    fill="#FFFFFF25"
                                />
                            </svg>
                        </button>

                        {/* INFO Button */}
                        <button
                            className="w-9 h-9 rounded-md shadow-sm flex items-center justify-center"
                            style={{
                                backgroundColor: "#D6D5C9",
                                color: "#592941",
                                border: "none",
                            }}
                            onClick={() => MainStore.setIsInfoOpen(true)}
                        >
                            <svg
                                viewBox="-16 0 130 100"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="#592941"
                                    stroke="#592941"
                                    strokeWidth="2"
                                />

                                <circle cx="50" cy="50" r="36" fill="#592941" />

                                <circle cx="50" cy="35" r="4" fill="#FFFFFF" />

                                <rect
                                    x="46"
                                    y="45"
                                    width="8"
                                    height="25"
                                    rx="4"
                                    fill="#FFFFFF"
                                />

                                <ellipse
                                    cx="42"
                                    cy="42"
                                    rx="8"
                                    ry="12"
                                    fill="#FFFFFF20"
                                />
                            </svg>
                        </button>


                    </div>

                    {/* Plan selector */}
                    <div className="relative">
                        <button
                            className="flex-1 px-3 py-2 rounded-xl shadow-sm text-sm"
                            style={{
                                backgroundColor: "#808080",
                                color: "#592941",
                                border: "1px solid #D6D5C9",
                                backdropFilter: "none",
                            }}
                        >
                            {getPlanLabel()}
                        </button>
                    </div>
                </div>
            </div>


            {/* Bottom Controls */}
            <div className="absolute bottom-13 left-0 w-full px-4 z-10 pointer-events-auto">
                <div className="flex flex-col items-center justify-center w-full gap-3">
                    {/* Suitability Score Button */}
                    <div className="flex items-center justify-center w-full">
                        <button
                            className="px-6 py-3 text-sm font-medium flex items-center justify-center"
                            onClick={() => {
                                if (!MainStore.markerCoords) {
                                    toast.error(t("Please place a marker first"));
                                    return;
                                }
                                if (!hasSuitabilityData) {
                                    toast.error(t("No suitability data at this location"));
                                    return;
                                }
                                // Set the coordinates from marker and open bottom sheet
                                MainStore.setSiteSuitabilityPixelCoords(MainStore.markerCoords);
                                MainStore.setIsSiteSuitabilityPopupOpen(true);
                            }}
                            disabled={!MainStore.isMarkerPlaced || !hasSuitabilityData || isCheckingData}
                            style={{
                                backgroundColor: (!MainStore.isMarkerPlaced || !hasSuitabilityData || isCheckingData)
                                    ? "#696969"
                                    : "#2E7D32",
                                color: (!MainStore.isMarkerPlaced || !hasSuitabilityData || isCheckingData)
                                    ? "#A8A8A8"
                                    : "#FFFFFF",
                                border: "none",
                                borderRadius: "22px",
                                height: "44px",
                                width: "350px",
                                cursor: (!MainStore.isMarkerPlaced || !hasSuitabilityData || isCheckingData)
                                    ? "not-allowed"
                                    : "pointer",
                                transition:
                                    "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                            }}
                        >
                            {isCheckingData ? t("Checking...") : t("Site Suitability")}
                        </button>
                    </div>

                    {/* Propose Plantation Button */}
                    <div className="flex items-center justify-center w-full">
                        <button
                            className="px-6 py-3 text-sm font-medium flex items-center justify-center"
                            onClick={toggleFormsUrl}
                            disabled={!MainStore.isMarkerPlaced}
                            style={{
                                backgroundColor: !MainStore.isMarkerPlaced
                                    ? "#696969"
                                    : "#D6D5C9",
                                color: !MainStore.isMarkerPlaced
                                    ? "#A8A8A8"
                                    : "#592941",
                                border: "none",
                                borderRadius: "22px",
                                height: "44px",
                                width: "350px",
                                cursor: !MainStore.isMarkerPlaced
                                    ? "not-allowed"
                                    : "pointer",
                                transition:
                                    "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                            }}
                        >
                            {t("Propose Plantation")}
                        </button>
                    </div>

                    {/* Back Button */}
                    <div className="flex items-center justify-center w-full gap-3">
                        <button
                            className="px-6 py-3 text-sm font-medium flex items-center justify-center"
                            onClick={() => navigate("/maps")}
                            style={{
                                backgroundColor: "#D6D5C9",
                                color: "#592941",
                                border: "none",
                                borderRadius: "22px",
                                height: "44px",
                                width: "350px",
                                cursor: "pointer",
                                transition:
                                    "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                            }}
                        >
                            {t("Back")}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Agrohorticulture;
