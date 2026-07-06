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
            <div className="bg-slate-50 min-h-full flex items-center justify-center h-64">
                <SquircleLoader />
            </div>
        );
    }

    if (!analysisData) {
        return (
            <div className="bg-slate-50 min-h-full px-4 py-6">
                <div className="max-w-3xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                    <div className="text-base font-bold text-slate-900 mb-1">
                        {t("No data available at this location")}
                    </div>
                    <div className="text-sm text-slate-500">
                        {t("Please tap on a different location on the map")}
                    </div>
                </div>
            </div>
        );
    }

    const scoreValue = analysisData["Site Suitability Score"];
    const scoreConfig = scoreValue !== undefined ? getConfig(scoreValue) : null;
    const { lat, lon } = analysisData.coordinates;

    return (
        <div className="min-h-full bg-slate-50">
            <div className="max-w-3xl mx-auto px-4 pt-3 pb-6 space-y-5">
                <div className="text-center">
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                    {t("Site Suitability")}
                    </h1>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                        {lat.toFixed(5)}°, {lon.toFixed(5)}°
                    </p>
                </div>

                {scoreConfig && (
                    <section className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
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
                        <div className="bg-white px-5 py-3 flex items-center gap-1.5 border-t border-slate-100">
                            <svg className="w-3 h-3 text-slate-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                            <span className="text-xs font-mono text-slate-500">
                                {lat.toFixed(5)}°, {lon.toFixed(5)}°
                            </span>
                        </div>
                    </section>
                )}

                <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="font-bold text-slate-800 mb-3">
                        {t("Component Scores")}
                    </h2>
                    <div className="flex flex-col gap-2">
                        {BAND_ORDER.filter((band) => analysisData[band] !== undefined).map((band) => {
                            const cfg = getConfig(analysisData[band]);
                            return (
                                <div
                                    key={band}
                                    className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center justify-between"
                                >
                                    <span className="text-sm text-slate-700 font-semibold">{t(band)}</span>
                                    <span
                                        className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                                        style={{ backgroundColor: cfg.color }}
                                    >
                                        {t(cfg.label)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs text-slate-500 leading-relaxed">
                        {t("Score based on climate, soil, socioeconomic, ecological, and topographic factors. Lower score = better suitability.")}
                    </p>
                </section>
            </div>
        </div>
    );
};

export default SiteSuitabilityAnalysis;
