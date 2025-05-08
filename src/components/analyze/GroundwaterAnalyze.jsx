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

/* → 1.  Years are now fixed                                      */
const YEAR_LABELS = ["2017", "2018", "2019", "2020", "2021", "2022"];

/* pretty‑print */
const fmt = (v, d = 0) =>
  v !== undefined
    ? Number(v).toLocaleString("en-IN", { maximumFractionDigits: d })
    : "—";

const CAPSULE_KEYS = ["DeltaG", "Precipitation", "RunOff", "WellDepth"];

const GroundwaterAnalyze = () => {
  const fortnightData = useMainStore((state) => state.fortnightData)
  const yearlyData = useMainStore((state) => state.selectedResource)

  /* slider index */
  const [idx, setIdx] = useState(0);
  const yearFour = YEAR_LABELS[idx]; // "2017" … "2022"

  /* 2.  annual record for that year ----------------------------- */
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

  /* 3.  slice fortnight data ------------------------------------ */
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

  /* 4.  chart data (unchanged) ---------------------------------- */
  const barLine = {
    labels: fort.dates,
    datasets: [
      {
        type: "bar",
        label: "Precipitation (mm)",
        data: fort.prec,
        backgroundColor: "#0284c7",
        borderRadius: 3,
        yAxisID: "y",
      },
      {
        type: "line",
        label: "Run‑off (mm)",
        data: fort.run,
        borderColor: "#dc2626",
        backgroundColor: "#dc262680",
        tension: 0.3,
        fill: false,
        yAxisID: "y1",
      },
    ],
  };

  const etArea = {
    labels: fort.dates,
    datasets: [
      {
        label: "Evapotranspiration (mm)",
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
        label: "Ground‑water Storage (mm)",
        data: fort.gw,
        borderColor: "#7e22ce",
        backgroundColor: "#7e22ce55",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  /* 5.  UI ------------------------------------------------------ */
  return (
    <>
      <div className="sticky top-0 z-20 bg-white text-center pt-8 text-xl font-bold text-gray-800 border-b border-gray-300 shadow-md pb-2">
        Ground‑water Analysis
      </div>

      <div className="p-4 max-w-6xl mx-auto space-y-8 mt-4">
        <h2 className="text-center font-extrabold text-gray-700 mb-3 text-sm">
            Change in Ground‑water Table over the Years
        </h2>

        {/* year slider */}
        <div className="w-3/4 max-w-lg mx-auto">
            <input
                type="range"
                min="0"
                max={YEAR_LABELS.length - 1}
                value={idx}
                onChange={(e) => setIdx(Number(e.target.value))}
                className="w-full accent-[#0f766e]"
            />
            <div className="flex justify-between text-sm font-bold mt-1">
                {YEAR_LABELS.map((y) => (
                <span key={y} className="flex-1 text-center">
                    {y}
                </span>
                ))}
            </div>
        </div>
        {/* capsules */}
        {hasAnnual ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CAPSULE_KEYS.map((k) => (
              <div
                key={k}
                className="rounded-xl bg-[#f8fafc] border border-gray-200 p-4 text-center shadow-sm"
              >
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                  {k}
                </div>
                <div className="text-lg font-bold">{fmt(annual[k], 1)}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">
            No annual data for {yearFour}
          </p>
        )}

        {/* Precip + Run‑off chart */}
        <section>
          <h2 className="font-bold text-gray-700 mb-2">
            Precipitation vs. Run‑off ({yearFour})
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
                      ticks: { color: "#dc2626" },
                    },
                    x: { ticks: { maxRotation: 45, minRotation: 45 } },
                  },
                  plugins: { legend: { position: "top" } },
                }}
              />
            </div>
          ) : (
            <p className="text-center text-gray-500">No data available</p>
          )}
        </section>

        {/* ET area */}
        <section>
          <h2 className="font-bold text-gray-700 mb-2">Evapotranspiration (ET)</h2>
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
            <p className="text-center text-gray-500">No data available</p>
          )}
        </section>

        {/* Ground‑water area */}
        <section>
          <h2 className="font-bold text-gray-700 mb-2">Ground‑water Storage (G)</h2>
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
            <p className="text-center text-gray-500">No data available</p>
          )}
        </section>

        {/* explanation blocks remain unchanged … */}
        <section className="space-y-8 text-sm leading-relaxed text-gray-700 mt-8">

        {/* 1.  Precipitation & Run‑off */}
        <div>
            <h3 className="font-bold mb-2">
                Precipitation &amp; Run‑off
            </h3>
            <p>
            The first graph shows the amount of rainfall in this area, and the portion of that rainfall lost in runoff. High runoff would typically indicate an opportunity for constructing groundwater recharge structures such as check dams, percolation tanks, and trenches and bunds.
            </p>
        </div>

        {/* 2.  Ground‑water Storage */}
        <div>
            <h3 className="font-bold mb-2">
                Evapotranspiration
            </h3>
            <p>
            The second graph shows for the area the water lost from water bodies through evaporation, and from vegetation through transpiration. An increase in cropping intensity would typically result in an increase in evapotranspiration due to greater use of water, often obtained from groundwater. A different choice of crops and trees would change the evapotranspiration in an area.
            </p>
        </div>

        {/* 3.  Evapotranspiration */}
        <div>
            <h3 className="font-bold mb-2">
                Groundwater
            </h3>
            <p>
            The third graph shows the drop or increase in groundwater levels. Greater evapotranspiration, greater runoff, or less rainfall, would typically lead to a drop in groundwater levels. Recharge structures to improve groundwater, or alternative cropping patterns to reduce water usage, can help improve groundwater levels.
            </p>
        </div>

        </section>
      </div>
    </>
  );
};

export default GroundwaterAnalyze;
