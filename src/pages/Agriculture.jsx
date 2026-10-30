import React, { useState, useEffect } from "react";
import useMainStore from "../store/MainStore.jsx";
import getOdkUrlForScreen from "../action/getOdkUrl.js";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageTitle from "../components/PageTitle.jsx";
import toast from "react-hot-toast";
import MapControls from "../components/MapControls.jsx";
import StepBar from "../components/ui/StepBar.jsx";

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
        "24-25",
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

    const handleAnalyze = () => {
        MainStore.setIsAgriculture(true);
        MainStore.setIsOpen(true);
    };

    const handleStartPlanning = () => {
        MainStore.setCurrentStep(1);
        // Set default layer for InfoBox legend
        MainStore.setLayerClicked("CLARTLayer");
        toast(t("toast_agri"));
    };

    const handleLayerChange = (layerName) => {
        setSelectedLayer(layerName);
        MainStore.setAgriLayerToggle(layerName);
        // Update layerClicked for InfoBox to show correct legend
        MainStore.setLayerClicked(layerName === "CLART" ? "CLARTLayer" : "TerrainLayer");
    };

    return (
        <>
            <PageTitle />

            <MapControls />

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
                                {t("Terrain")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Controls */}
            {MainStore.currentStep === 0 && (
                <StepBar
                    hint={!MainStore.isMarkerPlaced ? t("hint_place_pin") : null}
                    top={[
                        MainStore.isFeatureClicked
                            ? {
                                  label: t("Asset Info"),
                                  onClick: handleAssetInfo,
                                  disabled: !MainStore.isMarkerPlaced,
                              }
                            : {
                                  label: t("Cropping Pattern Analysis"),
                                  onClick: handleAnalyze,
                                  disabled: !MainStore.isMarkerPlaced,
                              },
                    ]}
                    back={{ label: t("Back"), onClick: () => navigate("/maps") }}
                    main={{
                        label: t("Start Planning"),
                        onClick: handleStartPlanning,
                        disabled: !MainStore.isMarkerPlaced,
                    }}
                />
            )}

            {MainStore.currentStep === 1 && (
                <StepBar
                    hint={!MainStore.isMarkerPlaced ? t("hint_place_pin") : null}
                    top={[
                        {
                            label: t("Propose Maintenance"),
                            onClick: () => toggleFormsUrl(true),
                            disabled: !MainStore.isFeatureClicked,
                        },
                        {
                            label: t("New Irrigation Work"),
                            onClick: () => toggleFormsUrl(false),
                            disabled: MainStore.isFeatureClicked,
                        },
                    ]}
                    back={{
                        label: t("Back"),
                        onClick: () => {
                            MainStore.setCurrentStep(0);
                            setSelectedLayer("CLART");
                        },
                    }}
                    main={{
                        label: t("Site Analysis"),
                        onClick: () => {
                            if (MainStore.markerCoords) {
                                MainStore.setSiteAnalysisCoords(MainStore.markerCoords);
                                MainStore.setIsSiteAnalysis(true);
                                MainStore.setIsOpen(true);
                            }
                        },
                        disabled: !MainStore.isMarkerPlaced,
                    }}
                    next={{ label: t("Finish"), onClick: () => navigate("/maps") }}
                />
            )}
        </>
    );
};

export default Agriculture;
