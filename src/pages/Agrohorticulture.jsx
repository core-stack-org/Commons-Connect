import { useState, useEffect } from "react";
import useMainStore from "../store/MainStore.jsx";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import getOdkUrlForScreen from "../action/getOdkUrl.js";
import getSiteSuitabilityBandValues from "../action/getSiteSuitabilityBandValues.js";
import getRasterValue from "../action/getRasterValue.js";
import MapControls from "../components/MapControls.jsx";
import StepBar from "../components/ui/StepBar.jsx";

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

            <MapControls />

            {/* Bottom Controls */}
            <StepBar
                hint={
                    !MainStore.isMarkerPlaced
                        ? t("hint_place_pin")
                        : !isCheckingData && !hasSuitabilityData
                          ? t("No suitability data at this location")
                          : null
                }
                top={[
                    {
                        label: isCheckingData ? t("Checking...") : t("Site Suitability"),
                        variant: "success",
                        onClick: () => {
                            // Set the coordinates from marker and open bottom sheet
                            MainStore.setSiteSuitabilityPixelCoords(MainStore.markerCoords);
                            MainStore.setIsSiteSuitabilityPopupOpen(true);
                        },
                        disabled: !MainStore.isMarkerPlaced || !hasSuitabilityData || isCheckingData,
                    },
                    {
                        label: t("Propose Plantation"),
                        onClick: toggleFormsUrl,
                        disabled: !MainStore.isMarkerPlaced,
                    },
                ]}
                main={{ label: t("Back"), onClick: () => navigate("/maps") }}
            />
        </>
    );
};

export default Agrohorticulture;
