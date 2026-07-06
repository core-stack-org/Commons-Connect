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
const cardClass =
    "rounded-2xl bg-white border border-slate-200 p-3.5 text-center shadow-[0_8px_24px_rgba(15,23,42,0.08)]";

/* pretty-print */
const fmt = (v, d = 0) =>
    v !== undefined
        ? Number(v).toLocaleString("en-IN", { maximumFractionDigits: d })
        : "—";

// 2020 → "2020-21"
const agrFullLabel = (y) => `${y}-${String(y + 1).slice(-2)}`;

// 2020 → "'20-21"
const agrShortLabel = (y) => `'${String(y).slice(-2)}-${String(y + 1).slice(-2)}`;

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
                    label: `Drought Frequency (${agrFullLabel(year)})`,
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
            chartInstanceRef.current.options.scales.x.title.text = `Year: ${agrFullLabel(year)}`;
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
                            title: { display: true, text: `Year: ${agrFullLabel(year)}` },
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
            labels: [agrFullLabel(year)],
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
            labels: croppingYears.map(agrFullLabel),
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
        ? `${agrFullLabel(croppingYears[0])} – ${agrFullLabel(croppingYears[croppingYears.length - 1])}`
        : "2017-18 – 2021-22";

    return (
        <div className="bg-slate-50 min-h-full">
            <div className="max-w-6xl mx-auto px-4 pt-3 pb-6 space-y-5">
                <div className="text-center">
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                        {t("agri_heading")}
                    </h1>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                        {t("Annual Summary")} · {agrFullLabel(year)}
                    </p>
                </div>

                {hasAnnual ? (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {CAPSULE_KEYS.map((k, index) => (
                            <div
                                key={k}
                                className={`${cardClass} ${
                                    index === CAPSULE_KEYS.length - 1 ? "col-span-2 sm:col-span-1" : ""
                                }`}
                            >
                                <div className="min-h-10 flex items-center justify-center text-[13px] leading-snug font-medium tracking-wide text-slate-500">
                                    {t(k)}
                                </div>
                                <div className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">
                                    {fmt(annual[k], k === "Cropping Intensity" ? 1 : 0)}
                                    {k === "Cropping Intensity" ? "" : " weeks"}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-slate-500 shadow-sm">
                        {t("info_blank")} {agrFullLabel(year)}
                    </p>
                )}

                <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
                    <div className="text-center">
                        <h2 className="text-base font-bold text-slate-800">
                            {t("Yearly Analysis")}
                        </h2>
                        <span className="mt-1 block text-xl font-extrabold text-[#0f766e]">
                            {agrFullLabel(year)}
                        </span>
                    </div>

                    <div className="w-full max-w-md mx-auto pt-4 px-1">
                        <div className="relative mb-3">
                            <div className="flex justify-between relative">
                                {YEARS.map((y, index) => {
                                    const showLabel =
                                        index === 0 || index === YEARS.length - 1 || index === idx;

                                    return (
                                        <div
                                            key={y}
                                            className="flex flex-col items-center relative flex-1"
                                        >
                                            <div
                                                className={`w-0.5 transition-all duration-200 ${
                                                    index === idx ? "h-4 bg-[#0f766e]" : "h-2 bg-gray-400"
                                                }`}
                                            />
                                            {showLabel && (
                                                <span
                                                    className={`text-xs font-medium mt-1 transition-colors duration-200 ${
                                                        index === idx
                                                            ? "text-[#0f766e] font-bold"
                                                            : "text-gray-500"
                                                    }`}
                                                >
                                                    {agrShortLabel(y)}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <input
                            type="range"
                            min="0"
                            max={YEARS.length - 1}
                            value={idx}
                            onChange={(e) => setIdx(Number(e.target.value))}
                            className="w-full accent-[#0f766e] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-custom"
                        />

                        <style>{`
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
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="font-bold text-slate-800 mb-3">
                        {t("drought_header")} ({agrFullLabel(year)})
                    </h2>
                    {hasDroughtData ? (
                        <div className="relative h-72">
                            <canvas ref={chartRef} />
                        </div>
                    ) : (
                        <p className="text-center text-slate-500 py-10">
                            {t("No data available")}
                        </p>
                    )}
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="font-bold text-slate-800 mb-3">
                        {t("cropping_in_header")} ({agrFullLabel(year)})
                    </h2>
                    {totalCropableAreaKey && selectedResource[totalCropableAreaKey] > 0 ? (
                        <div className="relative h-72">
                            <canvas ref={cropChartRef} />
                        </div>
                    ) : (
                        <p className="text-center text-slate-500 py-10">
                            {t("No data available")}
                        </p>
                    )}
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="font-bold text-slate-800 mb-3">
                        {t("Cropping Intensity Trend")} ({trendYearRange})
                    </h2>
                    {totalCropableAreaKey && selectedResource[totalCropableAreaKey] > 0 ? (
                        <div className="relative h-72">
                            <canvas ref={lineChartRef} />
                        </div>
                    ) : (
                        <p className="text-center text-slate-500 py-10">
                            {t("No data available")}
                        </p>
                    )}
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-4 space-y-5 text-sm leading-relaxed text-slate-700 shadow-sm">
                    <div>
                        <h3 className="font-bold mb-1 text-slate-900">
                            {t("drought_header")}
                        </h3>
                        <p>{t("info_agri_modal_1")}</p>
                    </div>
                    <div>
                        <h3 className="font-bold mb-1 text-slate-900">
                            {t("cropping_in_header")}
                        </h3>
                        <p>{t("info_agri_modal_2")}</p>
                    </div>

                    <div className="flex justify-center pt-2">
                        <button
                            className="w-full px-4 py-3 rounded-2xl shadow-sm text-md font-semibold transition-opacity disabled:opacity-60"
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
                </section>
            </div>
        </div>
    );
};

export default AgricultureAnalyze;