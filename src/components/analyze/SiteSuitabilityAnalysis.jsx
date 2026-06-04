import { useEffect, useState } from "react";
import useMainStore from "../../store/MainStore.jsx";
import getSiteSuitabilityBandValues from "../../action/getSiteSuitabilityBandValues.js";
import SquircleLoader from "../SquircleLoader.jsx";
import { useTranslation } from "react-i18next";

const SUITABILITY_CONFIG = {
    1: { color: "#2E7D32", label: "Very Good" },
    2: { color: "#66BB6A", label: "Good" },
    3: { color: "#F9A825", label: "Moderate" },
    4: { color: "#E65100", label: "Marginally Suitable" },
    5: { color: "#C62828", label: "Unsuitable" },
};

const BAND_ORDER = ["Climate", "Soil", "Socioeconomic", "Ecology", "Topography"];

const SiteSuitabilityAnalysis = () => {
    const { t } = useTranslation();
    const MainStore = useMainStore((state) => state);
    const [loading, setLoading] = useState(true);
    const [analysisData, setAnalysisData] = useState(null);

    const getConfig = (value) =>
        SUITABILITY_CONFIG[Math.round(value)] ?? { color: "#9E9E9E", label: "Unknown" };

    useEffect(() => {
        const fetchBandValues = async () => {
            if (!MainStore.siteSuitabilityPixelCoords) {
                setLoading(false);
                return;
            }

            setLoading(true);
            const [lon, lat] = MainStore.siteSuitabilityPixelCoords;
            const districtName = MainStore.districtName?.toLowerCase();
            const blockName = MainStore.blockName?.toLowerCase();

            if (!districtName || !blockName) {
                setLoading(false);
                return;
            }

            const bandValues = await getSiteSuitabilityBandValues(districtName, blockName, lon, lat);

            if (bandValues && Object.keys(bandValues).length > 0) {
                setAnalysisData({ ...bandValues, coordinates: { lat, lon } });
                MainStore.setSiteSuitabilityPixelData(bandValues);
            } else {
                setAnalysisData(null);
            }

            setLoading(false);
        };

        fetchBandValues();
    }, [MainStore.siteSuitabilityPixelCoords, MainStore.districtName, MainStore.blockName]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <SquircleLoader />
            </div>
        );
    }

    if (!analysisData) {
        return (
            <div className="flex flex-col items-center justify-center h-48 px-6 text-center">
                <div className="text-sm font-medium text-gray-600 mb-1">
                    {t("No data available at this location")}
                </div>
                <div className="text-xs text-gray-400">
                    {t("Please tap on a different location on the map")}
                </div>
            </div>
        );
    }

    const scoreValue = analysisData["Site Suitability Score"];
    const scoreConfig = scoreValue !== undefined ? getConfig(scoreValue) : null;
    const { lat, lon } = analysisData.coordinates;

    return (
        <div className="min-h-full bg-gray-50 pb-6">
            {/* Header pill */}
            <div className="flex justify-center pt-4 pb-3">
                <span className="px-5 py-1.5 rounded-full bg-white text-slate-500 text-sm font-semibold tracking-wide border border-gray-200 shadow-sm">
                    {t("Site Suitability")}
                </span>
            </div>

            {/* Hero: overall score + location */}
            {scoreConfig && (
                <div className="mx-4 mb-3 rounded-2xl overflow-hidden shadow-sm">
                    <div
                        className="px-5 py-4 flex items-center justify-between"
                        style={{ backgroundColor: scoreConfig.color }}
                    >
                        <div>
                            <div className="text-[10px] font-semibold uppercase tracking-widest text-white/70 mb-0.5">
                                {t("Overall Rating")}
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {t(scoreConfig.label)}
                            </div>
                        </div>
                        <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                            style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }}
                        >
                            {Math.round(scoreValue)}
                        </div>
                    </div>
                    <div className="bg-white px-5 py-3 flex items-center gap-1.5 border-t border-gray-100">
                        <svg className="w-3 h-3 text-slate-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        <span className="text-xs font-mono text-slate-500">
                            {lat.toFixed(5)}°, {lon.toFixed(5)}°
                        </span>
                    </div>
                </div>
            )}

            {/* Component scores */}
            <div className="px-4 mb-3">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">
                    {t("Component Scores")}
                </div>
                <div className="flex flex-col gap-1.5">
                    {BAND_ORDER.filter((band) => analysisData[band] !== undefined).map((band) => {
                        const cfg = getConfig(analysisData[band]);
                        return (
                            <div
                                key={band}
                                className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm flex items-center justify-between"
                            >
                                <span className="text-sm text-gray-700 font-medium">{t(band)}</span>
                                <span
                                    className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                                    style={{ backgroundColor: cfg.color }}
                                >
                                    {t(cfg.label)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footnote */}
            <div className="mx-4 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                <p className="text-xs text-gray-400 leading-relaxed">
                    {t("Score based on climate, soil, socioeconomic, ecological, and topographic factors. Lower score = better suitability.")}
                </p>
            </div>
        </div>
    );
};

export default SiteSuitabilityAnalysis;
