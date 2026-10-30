import { useEffect, useRef, useState } from "react";
import useMainStore from "../store/MainStore.jsx";
import useLayersStore from "../store/LayerStore.jsx";
import getOdkUrlForScreen from "../action/getOdkUrl.js";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageTitle from "../components/PageTitle.jsx";
import toast from "react-hot-toast";
import MapControls from "../components/MapControls.jsx";
import StepBar from "../components/ui/StepBar.jsx";

const Groundwater = () => {
    const STATE_MACHINE = {
        1: {
            Screen: "analyze",
        },
        2: {
            Screen: "planning_site",
        },
        3: {
            Screen: "add_maintain",
        },
    };

    const { t } = useTranslation();
    const MainStore = useMainStore((state) => state);
    const LayersStore = useLayersStore((state) => state);
    const navigate = useNavigate();

    const NET_YEARS = [
        { value: "2017_22", label: "2017-2022" },
        { value: "2018_23", label: "2018-2023" },
        { value: "2019_24", label: "2019-2024" },
        { value: "2020_25", label: "2020-2025" },
    ];

    const [selectedLayer, setSelectedLayer] = useState("CLART");
    const [selectedSiteLayer, setSelectedSiteLayer] = useState("StreamOrder");
    const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
    const yearDropdownRef = useRef(null);

    useEffect(() => {
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

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target)) {
                setYearDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
            toggle,
            gpsCoords,
        );

        MainStore.setIsForm(true);
        MainStore.setFormUrl(formUrl);
        MainStore.setIsOpen(true);
    };

    const handleAnalyze = () => {
        MainStore.setIsGroundWater(true);
        MainStore.setIsOpen(true);
    };

    const handleAssetInfo = () => {
        MainStore.setIsOpen(true);
    };

    const handleSiteAnalysis = () => {
        if (MainStore.markerCoords) {
            MainStore.setSiteAnalysisCoords(MainStore.markerCoords);
            MainStore.setIsGroundWater(false);
            MainStore.setIsSiteAnalysis(true);
            MainStore.setIsOpen(true);
        }
    };

    const handleStartPlanning = () => {
        MainStore.setCurrentStep(1);
        MainStore.setLayerClicked("CLARTLayer");
        LayersStore.setCLARTLayer(true);
        LayersStore.setTerrainLayer(false);
        toast(t("toast_groundwater"));
    };

    const handleLayerChange = (layerName) => {
        setSelectedLayer(layerName);
        MainStore.setGroudwaterLayerToggle(layerName);
        // Update layerClicked for InfoBox to show correct legend
        MainStore.setLayerClicked(layerName === "CLART" ? "CLARTLayer" : "TerrainLayer");
    };

    const handleSiteLayerChange = (layerName) => {
        setSelectedSiteLayer(layerName);
        MainStore.setGroudwaterLayerToggle(layerName);
        // Update layerClicked for InfoBox to show correct legend
        MainStore.setLayerClicked(layerName === "StreamOrder" ? "StreamOrderLayer" : "NaturalDepressionLayer");
    };

    const goHome = () => {
        MainStore.setCurrentStep(0);
        MainStore.setCurrentScreen("HomeScreen");
        navigate("/maps");
    };

    const getHint = () => {
        const step = MainStore.currentStep;
        if (step === 1) {
            return !MainStore.isFeatureClicked ? t("hint_select_structure") : null;
        }
        if (step === 2 && MainStore.isFeatureClicked) return t("hint_existing_selected");
        return !MainStore.isMarkerPlaced ? t("hint_place_pin") : null;
    };

    return (
        <>
            <PageTitle />
            <MapControls />

            {/* 3. WellDepth Year Dropdown - Hide when planning starts */}
            {MainStore.currentStep === 0 && (
                <div className="absolute top-31.5 left-13 w-full px-4 z-10 flex justify-start pointer-events-auto">
                    <div className="relative inline-block" ref={yearDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setYearDropdownOpen((o) => !o)}
                            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium shadow-sm cursor-pointer"
                            style={{ backgroundColor: "#D6D5C9", color: "#592941" }}
                        >
                            <span>{NET_YEARS.find((y) => y.value === MainStore.selectWellDepthYear)?.label}</span>
                            <svg
                                width="12" height="12" viewBox="0 0 24 24" fill="none"
                                stroke="#592941" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                className={`transition-transform duration-200 ${yearDropdownOpen ? "rotate-180" : ""}`}
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>

                        {yearDropdownOpen && (
                            <div
                                className="absolute left-0 top-full mt-1 rounded-xl shadow-lg overflow-hidden z-20"
                                style={{ backgroundColor: "#D6D5C9", minWidth: "100%" }}
                            >
                                {NET_YEARS.map((yr) => (
                                    <button
                                        key={yr.value}
                                        type="button"
                                        onClick={() => {
                                            MainStore.setSelectedWellDepthYear(yr.value);
                                            setYearDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm font-medium transition-colors duration-150 cursor-pointer"
                                        style={{
                                            color: "#592941",
                                            backgroundColor: yr.value === MainStore.selectWellDepthYear ? "#ffffff" : "transparent",
                                        }}
                                        onMouseEnter={(e) => {
                                            if (yr.value !== MainStore.selectWellDepthYear) e.currentTarget.style.backgroundColor = "#c8c7bb";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = yr.value === MainStore.selectWellDepthYear ? "#ffffff" : "transparent";
                                        }}
                                    >
                                        {yr.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 4. Layers Slider - Only show in step 1 */}
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

            {/* 5. Site Layers Slider - Only show in step 2 */}
            {MainStore.currentStep === 2 && (
                <div className="absolute top-31.5 left-13 w-full px-4 z-10 flex justify-start pointer-events-auto">
                    <div className="flex gap-4 max-w-lg">
                        <div
                            className="relative inline-flex rounded-xl pb-0.5 pt-0.5"
                            style={{ backgroundColor: "#D6D5C9" }}
                        >
                            {/* Sliding white pill background */}
                            <div
                                className="absolute top-0.5 rounded-xl bg-white shadow-sm transition-all duration-300 ease-in-out"
                                style={{
                                    height: "calc(100% - 4px)",
                                    width: selectedSiteLayer === "NaturalDepression" ? "58%" : "42%",
                                    left: selectedSiteLayer === "NaturalDepression" ? "42%" : "0%",
                                }}
                            />

                            <button
                                type="button"
                                onClick={() => handleSiteLayerChange("StreamOrder")}
                                className="relative z-10 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap"
                                style={{ color: "#592941" }}
                            >
                                {t("Stream Order")}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSiteLayerChange("NaturalDepression")}
                                className="relative z-10 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap"
                                style={{ color: "#592941" }}
                            >
                                {t("Natural Depression")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Controls */}
            {MainStore.currentStep === 0 && (
                <StepBar
                    hint={getHint()}
                    top={[
                        MainStore.isFeatureClicked
                            ? {
                                  label: t("Asset Info"),
                                  onClick: handleAssetInfo,
                                  disabled: !MainStore.isMarkerPlaced,
                              }
                            : {
                                  label: t("Water Balance Analysis"),
                                  onClick: handleAnalyze,
                                  disabled: !MainStore.isMarkerPlaced,
                              },
                    ]}
                    back={{ label: t("Back"), onClick: goHome }}
                    main={{
                        label: t("Start Planning"),
                        onClick: handleStartPlanning,
                        disabled: !MainStore.isMarkerPlaced,
                    }}
                />
            )}

            {MainStore.currentStep === 1 && (
                <StepBar
                    hint={getHint()}
                    top={[
                        {
                            label: t("Propose Maintenance"),
                            onClick: () => toggleFormsUrl(true),
                            disabled: !MainStore.isFeatureClicked,
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
                        label: t("Plan for a new structure"),
                        onClick: () => {
                            MainStore.setCurrentStep(2);
                            MainStore.setLayerClicked("StreamOrderLayer");
                        },
                        disabled: MainStore.isFeatureClicked,
                    }}
                />
            )}

            {MainStore.currentStep === 2 && (
                <StepBar
                    hint={getHint()}
                    top={[
                        {
                            label: t("Propose Structure"),
                            onClick: () => toggleFormsUrl(false),
                            disabled: MainStore.isFeatureClicked,
                        },
                    ]}
                    back={{
                        label: t("Back"),
                        onClick: () => {
                            MainStore.setCurrentStep(1);
                            handleLayerChange("CLART");
                            setSelectedSiteLayer("StreamOrder");
                        },
                    }}
                    main={{
                        label: t("Site Analysis"),
                        onClick: handleSiteAnalysis,
                        disabled: !MainStore.isMarkerPlaced,
                    }}
                    next={{ label: t("Finish"), onClick: goHome }}
                />
            )}
        </>
    );
};

export default Groundwater;
