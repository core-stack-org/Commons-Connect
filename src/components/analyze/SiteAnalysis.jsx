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
            <div className="flex items-center justify-center h-96">
                <SquircleLoader />
            </div>
        );
    }

    if (!analysisData) {
        return (
            <div className="p-6 text-center text-gray-500">
                <div className="text-lg font-medium mb-2">No site analysis data available</div>
                <p className="text-sm">Please place a marker on the map and try again</p>
            </div>
        );
    }

    return (
        <div className="p-6 pb-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                    Site Analysis
                </h2>
            </div>

            <div className="space-y-4">
                {/* Location Details */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                        Location Coordinates
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="font-medium text-gray-600">
                                Latitude:
                            </span>
                            <span className="ml-2 text-gray-900">
                                {analysisData.coordinates.lat.toFixed(6)}°
                            </span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-600">
                                Longitude:
                            </span>
                            <span className="ml-2 text-gray-900">
                                {analysisData.coordinates.lon.toFixed(6)}°
                            </span>
                        </div>
                    </div>
                </div>

                {/* Analysis Parameters */}
                <div className="overflow-hidden rounded-2xl border border-green-200">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3">
                        <h4 className="font-medium text-gray-900">
                            Hydrological Parameters
                        </h4>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-green-100">
                                <th className="px-4 py-2.5 text-left font-semibold text-gray-700 border-b border-green-200">
                                    Parameter
                                </th>
                                <th className="px-4 py-2.5 text-right font-semibold text-gray-700 border-b border-green-200">
                                    Value
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-white hover:bg-green-50 transition-colors">
                                <td className="px-4 py-3 text-gray-600 border-b border-green-100">
                                    Distance to Nearest Upstream Drainage Line
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900 border-b border-green-100">
                                    {analysisData.drainageLine !== "N/A"
                                        ? `${parseFloat(analysisData.drainageLine).toFixed(2)} m`
                                        : "Data not available"
                                    }
                                </td>
                            </tr>
                            <tr className="bg-green-50/50 hover:bg-green-50 transition-colors">
                                <td className="px-4 py-3 text-gray-600 border-b border-green-100">
                                    Single Flow Catchment Area
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900 border-b border-green-100">
                                    {analysisData.catchmentArea !== "N/A"
                                        ? `${parseFloat(analysisData.catchmentArea).toFixed(2)} m²`
                                        : "Data not available"
                                    }
                                </td>
                            </tr>
                            <tr className="bg-white hover:bg-green-50 transition-colors">
                                <td className="px-4 py-3 text-gray-600 border-b border-green-100">
                                    Stream Order
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900 border-b border-green-100">
                                    {analysisData.streamOrder !== "N/A"
                                        ? analysisData.streamOrder
                                        : "Data not available"
                                    }
                                </td>
                            </tr>
                            <tr className="bg-green-50/50 hover:bg-green-50 transition-colors">
                                <td className="px-4 py-3 text-gray-600">
                                    Slope Percentage
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-gray-900">
                                    {analysisData.slopePercentage !== "N/A"
                                        ? `${parseFloat(analysisData.slopePercentage).toFixed(2)}%`
                                        : "Data not available"
                                    }
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Info Note */}
                <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex flex-col">
                        <div className="flex items-center mb-2">
                            <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="text-sm text-gray-600 leading-relaxed">
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

