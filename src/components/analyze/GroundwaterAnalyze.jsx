import { useState, useMemo } from "react";
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

/* → 1.  Years are now fixed */
const YEAR_LABELS = ["2017", "2018", "2019", "2020", "2021", "2022"];

/* pretty-print */
const fmt = (v, d = 0) =>
  v !== undefined
    ? Number(v).toLocaleString("en-IN", { maximumFractionDigits: d })
    : "—";

const CAPSULE_KEYS = ["DeltaG", "Precipitation", "RunOff", "ET", "WellDepth"];

const GroundwaterAnalyze = () => {
  const fortnightData = useMainStore((state) => state.fortnightData)
  const yearlyData = useMainStore((state) => state.selectedResource)
  const { t } = useTranslation();
  const MainStore = useMainStore((s) => s);

  /* slider index */
  const [idx, setIdx] = useState(YEAR_LABELS.length - 1);
  const yearFour = YEAR_LABELS[idx]; // "2017" … "2022"


  const annual = useMemo(() => {
    const k = Object.keys(yearlyData || {}).find((key) =>
      key.startsWith(yearFour)
    );
    try {
      return k ? JSON.parse(yearlyData[k] ?? "{}") : {};
    } catch {
      return {};
    }
  }, [yearFour, yearlyData]);


  const fort = useMemo(() => {
    if (!fortnightData) return { dates: [] };
    const out = { dates: [], prec: [], run: [], et: [], gw: [] };

    Object.entries(fortnightData)
      .filter(([d]) => d.startsWith(yearFour))
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
  }, [yearFour, fortnightData]);

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
            {t("info_gw_header_1")} {yearFour}
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
            {t("info_blank")} {yearFour}
          </p>
        )}

        <h2 className="text-center font-bold text-gray-700 text-lg pt-4">
          {t("Fortnightly changes")}
        </h2>

        {/* year slider */}
        <div className="w-3/4 max-w-lg mx-auto">
            {/* Year marks above slider */}
            <div className="relative mb-2">
                <div className="flex justify-between relative">
                    {YEAR_LABELS.map((year, index) => (
                        <div key={year} className="flex flex-col items-center relative">
                            {/* Tick mark */}
                            <div 
                                className={`w-0.5 h-3 mb-1 transition-colors duration-200 ${
                                    index === idx ? 'bg-[#0f766e]' : 'bg-gray-400'
                                }`}
                            />
                            {/* Year label */}
                            <span 
                                className={`text-xs font-semibold transition-colors duration-200 ${
                                    index === idx ? 'text-[#0f766e]' : 'text-gray-600'
                                }`}
                            >
                                {year}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Slider */}
            <input
                type="range"
                min="0"
                max={YEAR_LABELS.length - 1}
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
            {t("info_gw_header_2")} ({yearFour})
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
          <h2 className="font-bold text-gray-700 mb-2">{t("info_gw_header_4")} (G)</h2>
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