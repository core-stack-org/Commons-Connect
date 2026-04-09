import { useState, useMemo, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import useMainStore from "../../store/MainStore";
import { useTranslation } from "react-i18next";
import getOdkUrlForScreen from "../../action/getOdkUrl"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

/* pretty-print */
const fmt = (v, d = 0) =>
  v !== undefined
    ? Number(v).toLocaleString("en-IN", { maximumFractionDigits: d })
    : "—";

// "2017_2018" → "2017-18"  (for headings)
const agrFullLabel = (key) => {
  const [s, e] = key.split("_");
  return `${s}-${e.slice(-2)}`;
};

// "2017_2018" → "17-18"  (for compact slider ticks)
const agrShortLabel = (key) => {
  const [s, e] = key.split("_");
  return `${s.slice(-2)}-${e.slice(-2)}`;
};

// "2025-06-15" → "2024_2025", "2025-07-15" → "2025_2026"
const getAgrYearKeyFromDate = (isoDate) => {
  const [yearText, monthText] = isoDate.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const startYear = month >= 7 ? year : year - 1;
  return `${startYear}_${startYear + 1}`;
};

const CAPSULE_KEYS = ["DeltaG", "Precipitation", "RunOff", "ET", "WellDepth"];

const GroundwaterAnalyze = () => {
  const fortnightData = useMainStore((state) => state.fortnightData)
  const yearlyData = useMainStore((state) => state.selectedResource)
  const { t } = useTranslation();
  const MainStore = useMainStore((s) => s);

  /* Collect all agri-year keys ("2017_2018" …) from both data sources */
  const YEAR_KEYS = useMemo(() => {
    const keys = new Set();

    if (yearlyData) {
      Object.keys(yearlyData).forEach((key) => {
        if (/^\d{4}_\d{4}$/.test(key)) keys.add(key);
      });
    }

    // Synthesise agri-year keys from fortnight ISO dates when no yearly entry exists
    if (fortnightData) {
      Object.keys(fortnightData).forEach((key) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
          keys.add(getAgrYearKeyFromDate(key));
        }
      });
    }

    return Array.from(keys).sort();
  }, [yearlyData, fortnightData]);

  /* slider index */
  const [idx, setIdx] = useState(0);

  /* Default to latest year */
  useEffect(() => {
    if (YEAR_KEYS.length > 0) setIdx(YEAR_KEYS.length - 1);
  }, [YEAR_KEYS.length]);

  const selectedKey = YEAR_KEYS[idx] || "";          // "2017_2018"

  const annual = useMemo(() => {
    try {
      return selectedKey ? JSON.parse(yearlyData?.[selectedKey] ?? "{}") : {};
    } catch {
      return {};
    }
  }, [selectedKey, yearlyData]);

  const fort = useMemo(() => {
    if (!fortnightData) return { dates: [] };
    const out = { dates: [], prec: [], run: [], et: [], gw: [] };

    Object.entries(fortnightData)
      .filter(([d]) => getAgrYearKeyFromDate(d) === selectedKey)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([d, js]) => {
        try {
          const o = JSON.parse(js);
          out.dates.push(d);
          out.prec.push(o.Precipitation ?? 0);
          out.run.push(o.RunOff ?? 0);
          out.et.push(o.ET ?? 0);
          out.gw.push(o.G ?? 0);
        } catch {}
      });
    return out;
  }, [selectedKey, fortnightData]);

  const hasAnnual = Object.keys(annual).length > 0;
  const hasFort   = fort.dates.length > 0;


  const barLine = {
    labels: fort.dates,
    datasets: [
      {
        type: "bar",
        label: `${t("Precipitation")} (mm)`,
        data: fort.prec,
        backgroundColor: "#413ea0",
        borderRadius: 3,
        yAxisID: "y",
        order: 1,
        barPercentage: 0.3,
      },
      {
        type: "line",
        label: `${t("RunOff")} (mm)`,
        data: fort.run,
        borderColor: "#FF6EF4",
        backgroundColor: "#FF6EF480",
        tension: 0.3,
        fill: true,
        yAxisID: "y1",
        order: 2,
      },
    ],
  };

  const etArea = {
    labels: fort.dates,
    datasets: [
      {
        label: `${t("info_gw_header_3")} (mm)`,
        data: fort.et,
        borderColor: "#16a34a",
        backgroundColor: "#16a34a55",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const gwArea = {
    labels: fort.dates,
    datasets: [
      {
        label: `${t("info_gw_header_4")} (mm)`,
        data: fort.gw,
        borderColor: "#9F502A",
        backgroundColor: "#C59680",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const toggleFormsUrl = () => {
    MainStore.setIsForm(true)
    MainStore.setFormUrl(getOdkUrlForScreen(MainStore.currentScreen, MainStore.currentStep, MainStore.markerCoords, "", "", MainStore.blockName, MainStore.currentPlan.plan_id, MainStore.currentPlan.plan, "", !MainStore.isWaterbody, [0,0], true))
  }


  return (
    <>
      <div className="sticky top-12 z-10 bg-white text-center pt-8 text-xl font-bold text-gray-800 border-b border-gray-300 shadow-md pb-2">
        {t("gw_heading")}
      </div>

      <div className="p-4 max-w-6xl mx-auto space-y-8 mt-4">
        <h2 className="text-center font-extrabold text-gray-700 mb-3 text-sm">
            {t("info_gw_header_1")} {selectedKey ? agrFullLabel(selectedKey) : ""}
        </h2>

        {/* capsules */}
        {hasAnnual ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CAPSULE_KEYS.map((k) => (
              <div
                key={k}
                className="rounded-xl bg-[#f8fafc] border border-gray-200 p-4 text-center shadow-sm"
              >
                <div className="text-xs tracking-wide text-gray-500 mb-1">
                  {t(k)}
                </div>
                <div className="text-lg font-bold">{fmt(annual[k], 1)}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">
            {t("info_blank")} {selectedKey ? agrFullLabel(selectedKey) : ""}
          </p>
        )}

        <h2 className="text-center font-bold text-gray-700 text-lg pt-4">
          {t("Fortnightly changes")}
        </h2>

        {/* year slider */}
        <div className="w-full max-w-md mx-auto pt-4 pb-8 px-4">
            <div className="text-center mb-4">
                <span className="text-2xl font-bold text-[#0f766e]">
                    {selectedKey ? agrFullLabel(selectedKey) : ""}
                </span>
            </div>

            <div className="relative mb-2">
                <div className="flex justify-between relative">
                    {YEAR_KEYS.map((key, index) => {
                        const showLabel = index === 0 || index === YEAR_KEYS.length - 1 || index === idx;
                        return (
                            <div key={key} className="flex flex-col items-center relative flex-1">
                                <div
                                    className={`w-0.5 transition-all duration-200 ${
                                        index === idx ? 'h-4 bg-[#0f766e]' : 'h-2 bg-gray-400'
                                    }`}
                                />
                                {showLabel && (
                                    <span
                                        className={`text-xs font-medium mt-1 transition-colors duration-200 ${
                                            index === idx ? 'text-[#0f766e] font-bold' : 'text-gray-500'
                                        }`}
                                    >
                                        {agrShortLabel(key)}
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
                max={YEAR_KEYS.length - 1}
                value={idx}
                onChange={(e) => setIdx(Number(e.target.value))}
                className="w-full accent-[#0f766e] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-custom"
            />

            <style jsx>{`
                .slider-custom::-webkit-slider-thumb {
                    appearance: none;
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background: #0f766e;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .slider-custom::-moz-range-thumb {
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background: #0f766e;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
            `}</style>
        </div>

        {/* Precip + Run-off chart */}
        <section>
          <h2 className="font-bold text-gray-700 mb-2">
            {t("info_gw_header_2")} ({selectedKey ? agrFullLabel(selectedKey) : ""})
          </h2>
          {hasFort ? (
            <div className="relative h-64">
              <Bar
                data={barLine}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: { mode: "index", intersect: false },
                  scales: {
                    y: { beginAtZero: true, title: { display: true, text: "mm" } },
                    y1: {
                      beginAtZero: true,
                      position: "right",
                      grid: { drawOnChartArea: false },
                      ticks: { color: "#FF6EF4" },
                    },
                    x: { ticks: { maxRotation: 45, minRotation: 45 } },
                  },
                  plugins: { legend: { position: "top" } },
                }}
              />
            </div>
          ) : (
            <p className="text-center text-gray-500"> {t("info_blank")}</p>
          )}
        </section>

        {/* ET area */}
        <section>
          <h2 className="font-bold text-gray-700 mb-2">{t("info_gw_header_3")} (ET)</h2>
          {hasFort ? (
            <div className="relative h-56">
              <Line
                data={etArea}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: { beginAtZero: true, title: { display: true, text: "mm" } },
                    x: { ticks: { maxRotation: 45, minRotation: 45 } },
                  },
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
          ) : (
            <p className="text-center text-gray-500">{t("info_blank")}</p>
          )}
        </section>

        {/* Ground-water area */}
        <section>
          <h2 className="font-bold text-gray-700 mb-2">{t("info_gw_header_4")}</h2>
          {hasFort ? (
            <div className="relative h-56">
              <Line
                data={gwArea}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: { title: { display: true, text: "mm" } },
                    x: { ticks: { maxRotation: 45, minRotation: 45 } },
                  },
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
          ) : (
            <p className="text-center text-gray-500">{t("info_blank")}</p>
          )}
        </section>

        {/* explanation blocks remain unchanged … */}
        <section className="space-y-8 text-sm leading-relaxed text-gray-700 mt-8">

        {/* 1.  Precipitation & Run-off */}
        <div>
            <h3 className="font-bold mb-2">
              {t("info_gw_header_2")}
            </h3>
            <p>
              {t("info_gw_modal_1")}
            </p>
        </div>

        {/* 2.  Ground-water Storage */}
        <div>
            <h3 className="font-bold mb-2">
              {t("info_gw_header_3")}
            </h3>
            <p>
              {t("info_gw_modal_2")}
            </p>
        </div>

        {/* 3.  Evapotranspiration */}
        <div>
            <h3 className="font-bold mb-2">
              {t("info_gw_header_4")}
            </h3>
            <p>
              {t("info_gw_modal_3")}
            </p>
        </div>

        {/* Provide Feedback */}
        <div className="flex justify-center mt-6">
          <button
            className="flex-1 px-4 py-3 rounded-xl shadow-sm text-md"
            onClick={toggleFormsUrl}
            style={{ 
                backgroundColor: '#D6D5C9',
                color: '#592941',
                border: 'none', 
            }}
            disabled={MainStore.isFeatureClicked && !MainStore.isMarkerPlaced}
          >
          {t("Provide Feedback")}
          </button>
        </div>  
        </section>
      </div>
    </>
  );
};

export default GroundwaterAnalyze;