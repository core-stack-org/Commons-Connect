import { useEffect, useState } from "react";
import useMainStore from "../../store/MainStore.jsx";
import getRasterValue from "../../action/getRasterValue.js";
import SquircleLoader from "../SquircleLoader.jsx";

const SiteAnalysis = () => {
    const MainStore = useMainStore((state) => state);
    const currentScreen = useMainStore((state) => state.currentScreen);
    const [loading, setLoading] = useState(true);
    const [analysisData, setAnalysisData] = useState(null);

    useEffect(() => {
        const fetchRasterValues = async () => {
            if (!MainStore.siteAnalysisCoords) {
                setLoading(false);
                return;
            }

            setLoading(true);
            const [lon, lat] = MainStore.siteAnalysisCoords;
            const districtName = MainStore.districtName?.toLowerCase();
            const blockName = MainStore.blockName?.toLowerCase();

            if (!districtName || !blockName) {
                console.error("District or block name not available");
                setLoading(false);
                return;
            }

            const drainageLineValue = await getRasterValue(
                "distance_nearest_upstream_DL",
                `distance_to_drainage_line_${districtName}_${blockName}_raster`,
                lon,
                lat
            );

            const catchmentAreaValue = await getRasterValue(
                "catchment_area_singleflow",
                `catchment_area_${districtName}_${blockName}_raster`,
                lon,
                lat
            );

            const streamOrderValue = await getRasterValue(
                "stream_order",
                `stream_order_${districtName}_${blockName}_raster`,
                lon,
                lat
            );

            const slopePercentageValue = await getRasterValue(
                "slope_percentage",
                `${districtName}_${blockName}_slope_percentage_raster`,
                lon,
                lat
            );

            const data = {
                drainageLine: drainageLineValue !== null ? drainageLineValue : "N/A",
                catchmentArea: catchmentAreaValue !== null ? catchmentAreaValue : "N/A",
                streamOrder: streamOrderValue !== null ? streamOrderValue : "N/A",
                slopePercentage: slopePercentageValue !== null ? slopePercentageValue : "N/A",
                coordinates: { lat, lon }
            };

            setAnalysisData(data);
            MainStore.setSiteAnalysisData(data);
            setLoading(false);
        };

        fetchRasterValues();
    }, [MainStore.siteAnalysisCoords, MainStore.districtName, MainStore.blockName]);

    if (loading) {
        return (
            <div className="bg-slate-50 min-h-full flex items-center justify-center h-96">
                <SquircleLoader />
            </div>
        );
    }

    if (!analysisData) {
        return (
            <div className="bg-slate-50 min-h-full px-4 py-6">
                <div className="max-w-3xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                    <div className="text-lg font-bold text-slate-900 mb-2">
                        No site analysis data available
                    </div>
                    <p className="text-sm text-slate-500">
                        Please place a marker on the map and try again
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-full">
            <div className="max-w-4xl mx-auto px-4 pt-3 pb-6 space-y-5">
                <div className="text-center">
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                    Site Analysis
                    </h1>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                        Hydrological suitability parameters
                    </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
                    <h3 className="text-base font-bold text-slate-900 mb-3">
                        Location Coordinates
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                            <span className="block font-medium text-slate-500">
                                Latitude:
                            </span>
                            <span className="mt-1 block text-lg font-extrabold text-slate-950">
                                {analysisData.coordinates.lat.toFixed(6)}°
                            </span>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                            <span className="block font-medium text-slate-500">
                                Longitude:
                            </span>
                            <span className="mt-1 block text-lg font-extrabold text-slate-950">
                                {analysisData.coordinates.lon.toFixed(6)}°
                            </span>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                        <h4 className="font-bold text-slate-900">
                            Hydrological Parameters
                        </h4>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-white">
                                <th className="px-4 py-2.5 text-left font-semibold text-slate-600 border-b border-slate-200">
                                    Parameter
                                </th>
                                <th className="px-4 py-2.5 text-right font-semibold text-slate-600 border-b border-slate-200">
                                    Value
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-white">
                                <td className="px-4 py-3 text-slate-600 border-b border-slate-100">
                                    Distance to Nearest Upstream Drainage Line
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-slate-900 border-b border-slate-100">
                                    {analysisData.drainageLine !== "N/A"
                                        ? `${parseFloat(analysisData.drainageLine).toFixed(2)} m`
                                        : "Data not available"
                                    }
                                </td>
                            </tr>
                            <tr className="bg-slate-50/60">
                                <td className="px-4 py-3 text-slate-600 border-b border-slate-100">
                                    Single Flow Catchment Area
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-slate-900 border-b border-slate-100">
                                    {analysisData.catchmentArea !== "N/A"
                                        ? `${parseFloat(analysisData.catchmentArea).toFixed(2)} hectares`
                                        : "Data not available"
                                    }
                                </td>
                            </tr>
                            <tr className="bg-white">
                                <td className="px-4 py-3 text-slate-600 border-b border-slate-100">
                                    Stream Order
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-slate-900 border-b border-slate-100">
                                    {analysisData.streamOrder !== "N/A"
                                        ? analysisData.streamOrder
                                        : "Data not available"
                                    }
                                </td>
                            </tr>
                            <tr className="bg-slate-50/60">
                                <td className="px-4 py-3 text-slate-600">
                                    Slope Percentage
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                    {analysisData.slopePercentage !== "N/A"
                                        ? `${parseFloat(analysisData.slopePercentage).toFixed(2)}%`
                                        : "Data not available"
                                    }
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col">
                        <div className="flex items-center mb-2">
                            <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="text-sm text-slate-700 leading-relaxed">
                            {currentScreen === "Groundwater" ? (
                                <p>
                                    Sites on drainage lines, having a reasonable catchment area but not too large (4 to 40 ha), in higher stream orders (2, 3), and low slope (&lt; 15%) are good for checkdams. Sites in higher slopes and on drainage lines can sustain gully plugs. Sites in lower slopes and off drainage lines are good for contour trenches.
                                </p>
                            ) : currentScreen === "Agriculture" ? (
                                <p>
                                    Sites close to drainage lines (less than 50m), having a small catchment area (1 to 4 ha), in higher stream orders (3, 4), and low slope (&lt; 5%) are good for farm ponds. Sites on drainage lines can be preferred.
                                </p>
                            ) : (
                                <p>
                                    These parameters help assess the suitability of the location for water harvesting structures and understand the hydrological characteristics of the site.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SiteAnalysis;

