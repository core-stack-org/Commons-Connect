import React, { useState, useEffect, useRef, useMemo } from "react";
import Chart from "chart.js/auto";
import useMainStore from "../../store/MainStore";
import { useTranslation } from "react-i18next";
import getOdkUrlForScreen from "../../action/getOdkUrl";

const CAPSULE_KEYS = [
    "Mild Drought",
    "Moderate Drought",
    "Severe Drought",
    "Dry Spells",
    "Cropping Intensity",
];

/* pretty-print */
const fmt = (v, d = 0) =>
    v !== undefined
        ? Number(v).toLocaleString("en-IN", { maximumFractionDigits: d })
        : "—";

// Helper function to extract years from keys matching a pattern
const extractYearsFromKeys = (obj, pattern) => {
    if (!obj) return [];
    const regex = new RegExp(pattern);
    const years = new Set();

    Object.keys(obj).forEach((key) => {
        const match = key.match(regex);
        if (match && match[1]) {
            const year = parseInt(match[1], 10);
            if (!isNaN(year)) {
                years.add(year);
            }
        }
    });

    return Array.from(years).sort((a, b) => a - b);
};

// Helper function to find the total cropable area key
const findTotalCropableAreaKey = (obj) => {
    if (!obj) return null;
    const keys = Object.keys(obj);
    const matchingKey = keys.find((key) =>
        key.startsWith("total_cropable_area_ever_hydroyear_")
    );
    return matchingKey || null;
};

const AgricultureAnalyze = () => {
    const { t } = useTranslation();
    const MainStore = useMainStore((s) => s);

    const selectedMWSDrought = useMainStore(
        (state) => state.selectedMWSDrought,
    );
    const selectedResource = useMainStore((state) => state.selectedResource);

    // Dynamically extract available years
    const droughtYears = useMemo(() => {
        return extractYearsFromKeys(selectedMWSDrought, /^drlb_(\d{4})$/);
    }, [selectedMWSDrought]);

    const croppingYears = useMemo(() => {
        return extractYearsFromKeys(selectedResource, /^cropping_intensity_(\d{4})$/);
    }, [selectedResource]);

    // Use cropping years as the primary years for the slider (typically more extensive)
    const YEARS = useMemo(() => {
        if (croppingYears.length > 0) return croppingYears;
        if (droughtYears.length > 0) return droughtYears;
        return [2017, 2018, 2019, 2020, 2021, 2022]; // fallback
    }, [croppingYears, droughtYears]);

    const [idx, setIdx] = useState(YEARS.length - 1);
    const year = YEARS[idx];

    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const cropChartRef = useRef(null);
    const cropChartInstanceRef = useRef(null);
    const lineChartRef = useRef(null);
    const lineChartInstanceRef = useRef(null);

    // Find the total cropable area key dynamically
    const totalCropableAreaKey = useMemo(() => {
        return findTotalCropableAreaKey(selectedResource);
    }, [selectedResource]);

    const annual = useMemo(() => {
        const drlbKey = `drlb_${year}`;
        const dryspKey = `drysp_${year}`;

        // Check if drought data exists for this year
        const hasDroughtData = droughtYears.includes(year);

        let mildCount = 0;
        let moderateCount = 0;
        let severeCount = 0;
        let dryspellCount = 0;

        if (hasDroughtData && selectedMWSDrought) {
            if (selectedMWSDrought[drlbKey]) {
                const drlbArray = JSON.parse(selectedMWSDrought[drlbKey] || "[]");
                mildCount = drlbArray.filter((v) => v === 1).length;
                moderateCount = drlbArray.filter((v) => v === 2).length;
                severeCount = drlbArray.filter((v) => v === 3).length;
            }
            dryspellCount = selectedMWSDrought[dryspKey] || 0;
        }

        const cropIntensity = selectedResource
            ? selectedResource[`cropping_intensity_${year}`] || 0
            : 0;

        return {
            "Mild Drought": mildCount,
            "Moderate Drought": moderateCount,
            "Severe Drought": severeCount,
            "Dry Spells": dryspellCount,
            "Cropping Intensity": cropIntensity,
        };
    }, [year, selectedMWSDrought, selectedResource, droughtYears]);

    const hasAnnual = Object.keys(annual).length > 0;
    const hasDroughtData =
        hasAnnual &&
        droughtYears.includes(year) &&
        (annual["Mild Drought"] > 0 ||
            annual["Moderate Drought"] > 0 ||
            annual["Severe Drought"] > 0 ||
            annual["Dry Spells"] > 0);

    // Update slider index when YEARS changes
    useEffect(() => {
        setIdx(YEARS.length - 1);
    }, [YEARS]);

    useEffect(() => {
        if (!chartRef.current) return;

        if (!hasDroughtData) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
            return;
        }

        const data = {
            labels: ["Mild", "Moderate", "Severe", "Dryspell"],
            datasets: [
                {
                    label: `Drought Frequency (${year})`,
                    data: [
                        annual["Mild Drought"],
                        annual["Moderate Drought"],
                        annual["Severe Drought"],
                        annual["Dry Spells"],
                    ],
                    backgroundColor: [
                        "#F4D03F",
                        "#EB984E",
                        "#E74C3C",
                        "#8884d8",
                    ],
                    borderRadius: 6,
                    borderWidth: 0,
                },
            ],
        };

        const ctx = chartRef.current.getContext("2d");
        if (chartInstanceRef.current) {
            chartInstanceRef.current.data = data;
            chartInstanceRef.current.options.scales.x.title.text = `Year: ${year}`;
            chartInstanceRef.current.update();
        } else {
            chartInstanceRef.current = new Chart(ctx, {
                type: "bar",
                data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { precision: 0 },
                            title: {
                                display: true,
                                text: "Drought Frequency (# weeks)",
                            },
                        },
                        x: {
                            title: { display: true, text: `Year: ${year}` },
                        },
                    },
                    plugins: {
                        legend: { display: false },
                    },
                },
            });
        }
    }, [year, annual, hasDroughtData]);

    useEffect(() => {
        if (!cropChartRef.current || !totalCropableAreaKey) return;

        const totalCrop = selectedResource[totalCropableAreaKey] || 0;
        const single = selectedResource[`single_cropped_area_${year}`] || 0;
        const doubled = selectedResource[`doubly_cropped_area_${year}`] || 0;
        const tripled = selectedResource[`triply_cropped_area_${year}`] || 0;

        if (totalCrop === 0) {
            if (cropChartInstanceRef.current) {
                cropChartInstanceRef.current.destroy();
                cropChartInstanceRef.current = null;
            }
            return;
        }

        const singlePct = (single / totalCrop) * 100;
        const doublePct = (doubled / totalCrop) * 100;
        const triplePct = (tripled / totalCrop) * 100;
        const uncroppedPct = Math.max(
            0,
            100 - (singlePct + doublePct + triplePct),
        );

        const data = {
            labels: [`${year}`],
            datasets: [
                {
                    label: "Single",
                    data: [singlePct.toFixed(1)],
                    backgroundColor: "#57ad2b",
                    borderRadius: 4,
                },
                {
                    label: "Double",
                    data: [doublePct.toFixed(1)],
                    backgroundColor: "#e68600",
                    borderRadius: 4,
                },
                {
                    label: "Triple",
                    data: [triplePct.toFixed(1)],
                    backgroundColor: "#b3561d",
                    borderRadius: 4,
                },
                {
                    label: "Uncropped",
                    data: [uncroppedPct.toFixed(1)],
                    backgroundColor: "#A9A9A9",
                    borderRadius: 4,
                },
            ],
        };

        const ctx2 = cropChartRef.current.getContext("2d");
        if (cropChartInstanceRef.current) {
            cropChartInstanceRef.current.data = data;
            cropChartInstanceRef.current.update();
        } else {
            cropChartInstanceRef.current = new Chart(ctx2, {
                type: "bar",
                data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            stacked: true,
                        },
                        y: {
                            stacked: true,
                            beginAtZero: true,
                            max: 100,
                            ticks: { callback: (v) => v + "%" },
                            title: { display: true, text: "Cropping Patterns" },
                        },
                    },
                },
            });
        }
    }, [year, selectedResource, totalCropableAreaKey]);

    // Line chart effect - use all available cropping years
    useEffect(() => {
        if (!lineChartRef.current || croppingYears.length === 0) return;

        const dataPoints = croppingYears.map(
            (year) => selectedResource[`cropping_intensity_${year}`] || 0,
        );

        const data = {
            labels: croppingYears.map(String),
            datasets: [
                {
                    label: "Cropping Intensity",
                    data: dataPoints,
                    borderColor: "#3B82F6",
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointBackgroundColor: "#3B82F6",
                    pointBorderColor: "#ffffff",
                    pointBorderWidth: 2,
                    borderWidth: 3,
                },
            ],
        };

        const ctx3 = lineChartRef.current.getContext("2d");
        if (lineChartInstanceRef.current) {
            lineChartInstanceRef.current.data = data;
            lineChartInstanceRef.current.update();
        } else {
            lineChartInstanceRef.current = new Chart(ctx3, {
                type: "line",
                data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { precision: 0 },
                            title: {
                                display: true,
                                text: "Cropping Intensity",
                            },
                        },
                    },
                },
            });
        }
    }, [selectedResource, croppingYears]);

    const toggleFormsUrl = () => {
        MainStore.setIsForm(true);
        MainStore.setFormUrl(
            getOdkUrlForScreen(
                MainStore.currentScreen,
                MainStore.currentStep,
                MainStore.markerCoords,
                "",
                "",
                MainStore.blockName,
                MainStore.currentPlan.plan_id,
                MainStore.currentPlan.plan,
                "",
                !MainStore.isWaterbody,
                [0, 0],
                true,
            ),
        );
    };

    // Dynamic year range for the trend chart title
    const trendYearRange = croppingYears.length > 0
        ? `${croppingYears[0]}-${croppingYears[croppingYears.length - 1]}`
        : "2017-2022";

    return (
        <>
            <div className="sticky top-12 z-10 bg-white text-center pt-8 text-xl font-bold text-gray-800 border-b border-gray-300 shadow-md pb-2">
                {t("agri_heading")}
            </div>

            <div className="p-4 max-w-6xl mx-auto space-y-8 mt-4">
                <h2 className="text-center font-extrabold text-gray-700 mb-3 text-sm">
                    {t("Annual Summary")}
                </h2>

                {/* capsules */}
                {hasAnnual ? (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        {CAPSULE_KEYS.map((k) => (
                            <div
                                key={k}
                                className="rounded-xl bg-[#f8fafc] border border-gray-200 p-4 text-center shadow-sm"
                            >
                                <div className="text-xs tracking-wide text-gray-500 mb-1">
                                    {t(k)}
                                </div>
                                <div className="text-lg font-bold">
                                    {fmt(
                                        annual[k],
                                        k === "Cropping Intensity" ? 1 : 0,
                                    )}
                                    {k === "Cropping Intensity" ? "" : " weeks"}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500">
                        {t("info_blank")} {year}
                    </p>
                )}

                <h2 className="text-center font-bold text-gray-700 text-lg pt-4">
                    {t("Yearly Analysis")}
                </h2>

                {/* Drought chart */}
                <section>
                    <h2 className="font-bold text-gray-700 mb-2">
                        {t("drought_header")} ({year})
                    </h2>
                    {hasDroughtData ? (
                        <div className="relative h-72">
                            <canvas ref={chartRef} />
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-10">
                            {t("No data available")}
                        </p>
                    )}
                </section>

                {/* year slider */}
                <div className="w-full max-w-md mx-auto pt-4 pb-8 px-4">
                    {/* Currently selected year - prominent display */}
                    <div className="text-center mb-4">
                        <span className="text-2xl font-bold text-[#0f766e]">{year}</span>
                    </div>

                    {/* Year marks above slider */}
                    <div className="relative mb-2">
                        <div className="flex justify-between relative">
                            {YEARS.map((y, index) => {
                                // Show label only for first, last, and selected year
                                const showLabel = index === 0 || index === YEARS.length - 1 || index === idx;
                                return (
                                    <div
                                        key={y}
                                        className="flex flex-col items-center relative flex-1"
                                    >
                                        {/* Tick mark */}
                                        <div
                                            className={`w-0.5 transition-all duration-200 ${index === idx
                                                    ? "h-4 bg-[#0f766e]"
                                                    : "h-2 bg-gray-400"
                                                }`}
                                        />
                                        {/* Year label - abbreviated */}
                                        {showLabel && (
                                            <span
                                                className={`text-xs font-medium mt-1 transition-colors duration-200 ${index === idx
                                                        ? "text-[#0f766e] font-bold"
                                                        : "text-gray-500"
                                                    }`}
                                            >
                                                '{String(y).slice(-2)}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Slider */}
                    <input
                        type="range"
                        min="0"
                        max={YEARS.length - 1}
                        value={idx}
                        onChange={(e) => setIdx(Number(e.target.value))}
                        className="w-full accent-[#0f766e] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-custom"
                    />

                    {/* Add custom slider styles */}
                    <style jsx>{`
                        .slider-custom::-webkit-slider-thumb {
                            appearance: none;
                            height: 20px;
                            width: 20px;
                            border-radius: 50%;
                            background: #0f766e;
                            cursor: pointer;
                            border: 2px solid white;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                        }

                        .slider-custom::-moz-range-thumb {
                            height: 20px;
                            width: 20px;
                            border-radius: 50%;
                            background: #0f766e;
                            cursor: pointer;
                            border: 2px solid white;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                        }
                    `}</style>
                </div>

                {/* Cropping Pattern chart */}
                <section>
                    <h2 className="font-bold text-gray-700 mb-2">
                        {t("cropping_in_header")} ({year})
                    </h2>
                    {totalCropableAreaKey && selectedResource[totalCropableAreaKey] > 0 ? (
                        <div className="relative h-72">
                            <canvas ref={cropChartRef} />
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-10">
                            {t("No data available")}
                        </p>
                    )}
                </section>

                {/* Cropping Intensity Trend chart */}
                <section>
                    <h2 className="font-bold text-gray-700 mb-2">
                        {t("Cropping Intensity Trend")} ({trendYearRange})
                    </h2>
                    {totalCropableAreaKey && selectedResource[totalCropableAreaKey] > 0 ? (
                        <div className="relative h-72">
                            <canvas ref={lineChartRef} />
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-10">
                            {t("No data available")}
                        </p>
                    )}
                </section>

                {/* Explanation Section */}
                <section className="space-y-8 text-sm leading-relaxed text-gray-700 mt-8 pt-8 border-t">
                    <div>
                        <h3 className="font-bold mb-2">
                            {t("drought_header")}
                        </h3>
                        <p>{t("info_agri_modal_1")}</p>
                    </div>
                    <div>
                        <h3 className="font-bold mb-2">
                            {t("cropping_in_header")}
                        </h3>
                        <p>{t("info_agri_modal_2")}</p>
                    </div>
                </section>

                {/* Provide Feedback */}
                <div className="flex justify-center mt-6">
                    <button
                        className="flex-1 px-4 py-3 rounded-xl shadow-sm text-md"
                        onClick={toggleFormsUrl}
                        style={{
                            backgroundColor: "#D6D5C9",
                            color: "#592941",
                            border: "none",
                        }}
                        disabled={
                            MainStore.isFeatureClicked &&
                            !MainStore.isMarkerPlaced
                        }
                    >
                        {t("Provide Feedback")}
                    </button>
                </div>
            </div>
        </>
    );
};

export default AgricultureAnalyze;