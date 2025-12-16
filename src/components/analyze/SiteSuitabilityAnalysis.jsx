import { useEffect, useState } from "react";
import useMainStore from "../../store/MainStore.jsx";
import getSiteSuitabilityBandValues from "../../action/getSiteSuitabilityBandValues.js";
import SquircleLoader from "../SquircleLoader.jsx";
import { useTranslation } from "react-i18next";

/**
 * Component to display site suitability band values when user clicks the Suitability Score button
 * Shows 7 bands: Constant, Climate, Soil, Socioeconomic, Ecology, Topography, Site Suitability Score
 */
const SiteSuitabilityAnalysis = () => {
    const { t } = useTranslation();
    const MainStore = useMainStore((state) => state);
    const [loading, setLoading] = useState(true);
    const [analysisData, setAnalysisData] = useState(null);

    // Color mapping based on suitability score (matching SLD style)
    // 1 = Very Good, 2 = Good, 3 = Moderate, 4 = Marginally Suitable, 5 = Unsuitable
    const getSuitabilityColor = (value) => {
        const roundedValue = Math.round(value);
        if (roundedValue === 1) return "#2E7D32"; // Very Good - dark green
        if (roundedValue === 2) return "#66BB6A"; // Good - light green
        if (roundedValue === 3) return "#FDD835"; // Moderate - yellow
        if (roundedValue === 4) return "#FF8F00"; // Marginally Suitable - orange
        if (roundedValue === 5) return "#D32F2F"; // Unsuitable - red
        return "#9E9E9E"; // Unknown/No data - gray
    };

    const getSuitabilityLabel = (value) => {
        const roundedValue = Math.round(value);
        if (roundedValue === 1) return t("Very Good");
        if (roundedValue === 2) return t("Good");
        if (roundedValue === 3) return t("Moderate");
        if (roundedValue === 4) return t("Marginally Suitable");
        if (roundedValue === 5) return t("Unsuitable");
        return t("Unknown");
    };

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
                console.error("District or block name not available");
                setLoading(false);
                return;
            }

            const bandValues = await getSiteSuitabilityBandValues(
                districtName,
                blockName,
                lon,
                lat
            );

            if (bandValues && Object.keys(bandValues).length > 0) {
                setAnalysisData({
                    ...bandValues,
                    coordinates: { lat, lon }
                });
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
            <div className="flex items-center justify-center h-96">
                <SquircleLoader />
            </div>
        );
    }

    if (!analysisData) {
        return (
            <div className="p-6 text-center text-gray-500">
                <div className="text-lg font-medium mb-2">{t("No data available at this location")}</div>
                <p className="text-sm">{t("Please tap on a different location on the map")}</p>
            </div>
        );
    }

    // Define the order of bands for display (excluding Constant)
    const bandOrder = [
        "Climate",
        "Soil",
        "Socioeconomic",
        "Ecology",
        "Topography"
    ];

    return (
        <div className="p-6 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                    {t("Site Suitability Details")}
                </h2>
            </div>

            <div className="space-y-4">
                {/* Location Details - matches SiteAnalysis */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                        {t("Location Coordinates")}
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="font-medium text-gray-600">
                                {t("Latitude")}:
                            </span>
                            <span className="ml-2 text-gray-900">
                                {analysisData.coordinates.lat.toFixed(6)}°
                            </span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-600">
                                {t("Longitude")}:
                            </span>
                            <span className="ml-2 text-gray-900">
                                {analysisData.coordinates.lon.toFixed(6)}°
                            </span>
                        </div>
                    </div>
                </div>

                {/* Overall Suitability Score - Highlighted Card */}
                {analysisData["Site Suitability Score"] !== undefined && (
                    <div
                        className="rounded-2xl p-4 text-white"
                        style={{
                            backgroundColor: getSuitabilityColor(analysisData["Site Suitability Score"])
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium opacity-90">
                                    {t("Site Suitability Score")}
                                </h3>
                                <p className="text-3xl font-bold mt-1">
                                    {typeof analysisData["Site Suitability Score"] === 'number'
                                        ? Math.round(analysisData["Site Suitability Score"])
                                        : analysisData["Site Suitability Score"]}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-semibold bg-white/20 px-4 py-2 rounded-full">
                                    {getSuitabilityLabel(analysisData["Site Suitability Score"])}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Band Values Table - Green theme to match SiteAnalysis */}
                <div className="overflow-hidden rounded-2xl border border-green-200">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3">
                        <h4 className="font-medium text-gray-900">
                            {t("Component Scores")}
                        </h4>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-green-100">
                                <th className="px-4 py-2.5 text-left font-semibold text-gray-700 border-b border-green-200">
                                    {t("Parameter")}
                                </th>
                                <th className="px-4 py-2.5 text-right font-semibold text-gray-700 border-b border-green-200">
                                    {t("Value")}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {bandOrder
                                .filter(band => analysisData[band] !== undefined)
                                .map((band, index) => (
                                    <tr
                                        key={band}
                                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-green-50/50'
                                            } hover:bg-green-50 transition-colors`}
                                    >
                                        <td className="px-4 py-3 text-gray-600 border-b border-green-100">
                                            {t(band)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-gray-900 border-b border-green-100">
                                            {typeof analysisData[band] === 'number'
                                                ? analysisData[band].toFixed(2)
                                                : analysisData[band]}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {/* Info Note - matches SiteAnalysis */}
                <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex flex-col">
                        <div className="flex items-center mb-2">
                            <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="text-sm text-gray-600 leading-relaxed">
                            <p>
                                {t("The site suitability score is calculated based on multiple factors including climate conditions, soil quality, socioeconomic factors, ecological considerations, and topography. Higher scores indicate better suitability for agroforestry plantations.")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SiteSuitabilityAnalysis;

