import React, { useState, useEffect } from "react";
import useMainStore from "../store/MainStore.jsx";
import getOdkUrlForScreen from "../action/getOdkUrl.js";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

const Agriculture = () => {
    const MainStore = useMainStore((state) => state);
    const navigate = useNavigate();
    const { t } = useTranslation();

    const STATE_MACHINE = {
        1: {
            Screen: "analyze",
        },
        2: {
            Screen: "add_maintain",
        },
    };

    useEffect(() => {
        MainStore.setMarkerPlaced(false);
        const handleBackButton = () => {
            let BACK = MainStore.currentStep - 1;

            if (MainStore.currentStep) {
                MainStore.setCurrentStep(BACK);
            }
        };

        if (MainStore.currentStep > 0)
            window.history.pushState(
                null,
                "",
                `#${STATE_MACHINE[MainStore.currentStep].Screen}`,
            );

        window.addEventListener("popstate", handleBackButton);

        return () => {
            window.removeEventListener("popstate", handleBackButton);
        };
    }, [MainStore.currentStep]);

    const years = [
        "17-18",
        "18-19",
        "19-20",
        "20-21",
        "21-22",
        "22-23",
        "23-24",
    ];

    const [selectedLayer, setSelectedLayer] = useState("CLART");

    const handleYearChange = (e) => {
        MainStore.setLulcYearIdx(Number(e.target.value));
    };

    const toggleFormsUrl = (toggle) => {
        let gpsCoords = MainStore.gpsLocation;

        if (gpsCoords === null) {
            try {
                navigator.geolocation.getCurrentPosition(
                    ({ coords }) => {
                        gpsCoords = [coords.longitude, coords.latitude];
                    },
                    (err) => {
                        console.log("In first err : ", err);
                    },
                );
                if (gpsCoords === null) {
                    throw new Error("User object missing");
                }
            } catch (e) {
                console.log("In the catch ");
            }
            MainStore.setGpsLocation(gpsCoords);
        }
        if (MainStore.markerCoords) {
            MainStore.setIsForm(true);
            MainStore.setFormUrl(
                getOdkUrlForScreen(
                    MainStore.currentScreen,
                    MainStore.currentStep,
                    MainStore.markerCoords,
                    MainStore.settlementName,
                    "",
                    MainStore.blockName,
                    MainStore.currentPlan.plan_id,
                    MainStore.currentPlan.plan,
                    "",
                    toggle,
                    gpsCoords,
                ),
            );
            MainStore.setIsOpen(true);
        }
    };

    const handleAssetInfo = () => {
        MainStore.setIsOpen(true);
    };

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

    const handleAnalyze = () => {
        MainStore.setIsAgriculture(true);
        MainStore.setIsOpen(true);
    };

    const handleStartPlanning = () => {
        MainStore.setCurrentStep(1);
        // Set default layer for InfoBox legend
        MainStore.setLayerClicked("CLARTLayer");
        toast(t("toast_agri"), {
            duration: 5000,
            style: {
                background: "#ffffff",
                color: "#000000",
                borderRadius: "20px",
                padding: "10px",
                fontSize: "14px",
                fontFamily: "Inter",
                fontWeight: "400",
                textAlign: "left",
                lineHeight: "1.5",
            },
        });
    };

    const handleLayerChange = (layerName) => {
        setSelectedLayer(layerName);
        MainStore.setAgriLayerToggle(layerName);
        // Update layerClicked for InfoBox to show correct legend
        MainStore.setLayerClicked(layerName === "CLART" ? "CLARTLayer" : "TerrainLayer");
    };

    return (
        <>
            {/* Title Bubble (UNCHANGED) */}
            <div className="absolute top-4 left-0 w-full px-4 z-10 pointer-events-none">
                <div className="relative w-full max-w-lg mx-auto flex items-center">
                    <div className="flex-1 px-6 py-3 text-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-extrabold text-md shadow-md">
                        {t("Agriculture")}
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

                    {/* Plan selector with dropdown */}
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

            {/* ─── Vertical Year Slider (step 0 only) - On left side ─── */}
            {MainStore.currentStep === 0 && (
                <div className="absolute top-69 left-4 z-10 pointer-events-auto">
                    <div className="flex items-center gap-2">
                        {/* Vertical slider */}
                        <div className="relative" style={{ height: "280px" }}>
                            <input
                                type="range"
                                min="0"
                                max={years.length - 1}
                                step="1"
                                value={MainStore.lulcYearIdx}
                                onChange={handleYearChange}
                                orient="vertical"
                                className="vertical-slider"
                                style={{
                                    width: "280px",
                                    height: "8px",
                                    transform: "rotate(-90deg)",
                                    transformOrigin: "left top",
                                    position: "absolute",
                                    left: "4px",
                                    top: "280px",
                                }}
                            />
                        </div>

                        {/* Year labels with tick marks */}
                        <div
                            className="flex flex-col justify-between"
                            style={{ height: "280px" }}
                        >
                            {years
                                .slice()
                                .reverse()
                                .map((year, index) => {
                                    const actualIndex =
                                        years.length - 1 - index;
                                    return (
                                        <div
                                            key={year}
                                            className="flex items-center gap-1"
                                        >
                                            {/* Tick mark */}
                                            <div
                                                className={`h-0.5 w-3 transition-colors duration-200 ${actualIndex ===
                                                        MainStore.lulcYearIdx
                                                        ? "bg-[#592941]"
                                                        : "bg-gray-400"
                                                    }`}
                                            />
                                            {/* Year label with capsule background */}
                                            <span
                                                className={`text-xs font-bold transition-all duration-200 px-2 py-1 rounded-lg ${actualIndex ===
                                                        MainStore.lulcYearIdx
                                                        ? "text-white bg-[#592941]"
                                                        : "text-white bg-transparent"
                                                    }`}
                                            >
                                                {year}
                                            </span>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    {/* Custom slider styles */}
                    <style jsx>{`
                        .vertical-slider {
                            -webkit-appearance: none;
                            appearance: none;
                            background: #d1d5db;
                            border-radius: 4px;
                            outline: none;
                            cursor: pointer;
                        }

                        .vertical-slider::-webkit-slider-thumb {
                            -webkit-appearance: none;
                            appearance: none;
                            height: 20px;
                            width: 20px;
                            border-radius: 50%;
                            background: #592941;
                            cursor: pointer;
                            border: 2px solid white;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                        }

                        .vertical-slider::-moz-range-thumb {
                            height: 20px;
                            width: 20px;
                            border-radius: 50%;
                            background: #592941;
                            cursor: pointer;
                            border: 2px solid white;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                        }
                    `}</style>
                </div>
            )}

            {/* Layers Slider - Only show in step 1 */}
            {MainStore.currentStep === 1 && (
                <div className="absolute top-31.5 left-13 w-full px-4 z-10 flex justify-start pointer-events-auto">
                    <div className="flex gap-4 max-w-lg">
                        <div
                            className="relative inline-flex rounded-xl pb-0.5 pt-0.5"
                            style={{ backgroundColor: "#D6D5C9" }}
                        >
                            {/* Sliding white pill background */}
                            <div
                                className="absolute top-0.5 rounded-xl bg-white shadow-sm transition-transform duration-300 ease-in-out"
                                style={{
                                    height: "calc(100% - 4px)",
                                    width: "50%",
                                    transform:
                                        selectedLayer === "Terrain"
                                            ? "translateX(100%)"
                                            : "translateX(0%)",
                                }}
                            />

                            <button
                                type="button"
                                onClick={() => handleLayerChange("CLART")}
                                className="relative z-10 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer"
                                style={{ color: "#592941" }}
                            >
                                CLART
                            </button>
                            <button
                                type="button"
                                onClick={() => handleLayerChange("Terrain")}
                                className="relative z-10 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer"
                                style={{ color: "#592941" }}
                            >
                                Terrain
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Controls (UNCHANGED) */}
            <div className="absolute bottom-13 left-0 w-full px-4 z-10 pointer-events-auto">
                {MainStore.currentStep === 0 && !MainStore.isFeatureClicked && (
                    <div className="flex flex-col items-center justify-center w-full gap-3">
                        {/* Analyze Button - Top pill */}
                        <div className="flex items-center justify-center w-full">
                            <button
                                className="px-6 py-3 text-sm font-medium flex items-center justify-center"
                                onClick={() => handleAnalyze()}
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
                                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                                    cursor: !MainStore.isMarkerPlaced
                                        ? "not-allowed"
                                        : "pointer",
                                    transition:
                                        "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                                }}
                            >
                                {t("Microwatershed Analysis")}
                            </button>
                        </div>

                        {/* Separate Back and Start Planning Buttons - Bottom section */}
                        <div className="flex items-center justify-center w-full gap-3">
                            {/* Separate Back Button */}
                            <button
                                className="px-4 py-3 text-sm font-medium flex items-center justify-center"
                                onClick={() => navigate("/maps")}
                                style={{
                                    backgroundColor: "#D6D5C9",
                                    color: "#592941",
                                    border: "none",
                                    borderRadius: "22px",
                                    height: "44px",
                                    cursor: "pointer",
                                    transition:
                                        "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                                }}
                            >
                                {t("Back")}
                            </button>

                            {/* Start Planning Button */}
                            <button
                                className="px-6 py-3 text-sm font-medium flex items-center justify-center"
                                onClick={handleStartPlanning}
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
                                    width: "270px",
                                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                                    cursor: !MainStore.isMarkerPlaced
                                        ? "not-allowed"
                                        : "pointer",
                                    transition:
                                        "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                                }}
                            >
                                {t("Start Planning")}
                            </button>
                        </div>
                    </div>
                )}

                {MainStore.currentStep === 0 && MainStore.isFeatureClicked && (
                    <div className="flex flex-col items-center justify-center w-full gap-3">
                        {/* Asset Info Button - Top pill */}
                        <div className="flex items-center justify-center w-full">
                            <button
                                className="px-6 py-3 text-sm font-medium flex items-center justify-center"
                                onClick={handleAssetInfo}
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
                                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                                    cursor: !MainStore.isMarkerPlaced
                                        ? "not-allowed"
                                        : "pointer",
                                    transition:
                                        "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                                }}
                            >
                                {t("Asset Info")}
                            </button>
                        </div>

                        {/* Separate Back and Start Planning Buttons - Bottom section */}
                        <div className="flex items-center justify-center w-full gap-3">
                            {/* Separate Back Button */}
                            <button
                                className="px-4 py-3 text-sm font-medium flex items-center justify-center"
                                onClick={() => navigate("/maps")}
                                style={{
                                    backgroundColor: "#D6D5C9",
                                    color: "#592941",
                                    border: "none",
                                    borderRadius: "22px",
                                    height: "44px",
                                    cursor: "pointer",
                                    transition:
                                        "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                                }}
                            >
                                {t("Back")}
                            </button>

                            {/* Start Planning Button */}
                            <button
                                className="px-6 py-3 text-sm font-medium flex items-center justify-center"
                                onClick={handleStartPlanning}
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
                                    width: "270px",
                                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                                    cursor: !MainStore.isMarkerPlaced
                                        ? "not-allowed"
                                        : "pointer",
                                    transition:
                                        "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                                }}
                            >
                                {t("Start Planning")}
                            </button>
                        </div>
                    </div>
                )}

                {MainStore.currentStep === 1 && (
                    <div className="flex flex-col items-center justify-center w-full gap-3">
                        <div className="flex flex-col items-center justify-center w-full gap-3">
                            <button
                                className="px-6 py-3 text-sm font-medium flex items-center justify-center"
                                onClick={() => toggleFormsUrl(true)}
                                disabled={!MainStore.isFeatureClicked}
                                style={{
                                    backgroundColor: !MainStore.isFeatureClicked
                                        ? "#696969"
                                        : "#D6D5C9",
                                    color: !MainStore.isFeatureClicked
                                        ? "#A8A8A8"
                                        : "#592941",
                                    border: "none",
                                    borderRadius: "22px",
                                    height: "44px",
                                    width: "350px",
                                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                                }}
                            >
                                {t("Propose Maintenance")}
                            </button>
                            <button
                                className="px-6 py-3 text-sm font-medium flex items-center justify-center"
                                onClick={() => toggleFormsUrl(false)}
                                disabled={MainStore.isFeatureClicked}
                                style={{
                                    backgroundColor: MainStore.isFeatureClicked
                                        ? "#696969"
                                        : "#D6D5C9",
                                    color: MainStore.isFeatureClicked
                                        ? "#A8A8A8"
                                        : "#592941",
                                    border: "none",
                                    borderRadius: "22px",
                                    height: "44px",
                                    width: "350px",
                                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                                    cursor: MainStore.isFeatureClicked
                                        ? "not-allowed"
                                        : "pointer",
                                    transition:
                                        "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                                }}
                            >
                                {t("New Irrigation Work")}
                            </button>
                        </div>

                        {/* Separate Back, Site Analysis, and Finish Buttons - Bottom section */}
                        <div className="flex items-center justify-center w-full gap-3">
                            {/* Separate Back Button */}
                            <button
                                className="px-4 py-3 text-sm font-medium flex items-center justify-center"
                                onClick={() => {
                                    let BACK = MainStore.currentStep - 1;
                                    if (MainStore.currentStep) {
                                        MainStore.setCurrentStep(BACK);
                                        setSelectedLayer("CLART")
                                    }
                                }}
                                style={{
                                    backgroundColor: "#D6D5C9",
                                    color: "#592941",
                                    border: "none",
                                    borderRadius: "22px",
                                    height: "44px",
                                    cursor: "pointer",
                                    transition:
                                        "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                                }}
                            >
                                {t("Back")}
                            </button>

                            {/* Site Analysis Button */}
                            <button
                                className="px-6 py-3 text-sm font-medium flex items-center justify-center"
                                onClick={() => {
                                    if (MainStore.markerCoords) {
                                        MainStore.setSiteAnalysisCoords(MainStore.markerCoords);
                                        MainStore.setIsSiteAnalysis(true);
                                        MainStore.setIsOpen(true);
                                    }
                                }}
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
                                    width: "190px",
                                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                                    cursor: !MainStore.isMarkerPlaced
                                        ? "not-allowed"
                                        : "pointer",
                                    transition:
                                        "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                                }}
                            >
                                {t("Site Analysis")}
                            </button>

                            {/* Separate Finish Button */}
                            <button
                                className="px-4 py-3 text-sm font-medium flex items-center justify-center"
                                onClick={() => navigate("/maps")}
                                style={{
                                    backgroundColor: "#D6D5C9",
                                    color: "#592941",
                                    border: "none",
                                    borderRadius: "22px",
                                    height: "44px",
                                    cursor: "pointer",
                                    transition:
                                        "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                                }}
                            >
                                {t("Finish")}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Agriculture;
