import { useState, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import useMainStore from "../../store/MainStore";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const years = ["18-19", "19-20", "20-21", "21-22", "22-23", "23-24"];

const SurfaceWaterBodies = () => {
  const [idx, setIdx] = useState(0);
  const yearLabel = years[idx];
  const MainStore = useMainStore((s) => s);

  /* acreage (area_ored m² → acres) */
  const acreage = useMemo(() => {
    const sqMeters = Number(MainStore.selectedResource?.area_ored ?? 0);
    return (sqMeters / 4047).toFixed(2);
  }, [MainStore.selectedResource]);

  /* chart data + “hasData” flag */
  const { chartData, hasData } = useMemo(() => {
    const safe = (k) => Number(MainStore.selectedResource?.[k] ?? 0);
    const dataArr = [
      safe(`k_${yearLabel}`),
      safe(`kr_${yearLabel}`),
      safe(`krz_${yearLabel}`),
    ];
    return {
      chartData: {
        labels: ["Kharif", "Kharif‑Rabi", "Kharif‑Rabi‑Zaid"],
        datasets: [
          {
            label: yearLabel,
            backgroundColor: ["#E38627", "#C13C37", "#6A2135"],
            borderRadius: 4,
            data: dataArr,
          },
        ],
      },
      hasData: dataArr.some((v) => v > 0),
    };
  }, [idx, MainStore.selectedResource, yearLabel]);

  const boldFont = { weight: "bold" };

  return (
    <>
      {/* title */}
      <div className="sticky top-0 z-20 bg-white text-center pt-8 text-xl font-bold text-gray-800 border-b border-gray-300 shadow-md pb-2 mb-6">
        Waterbody Analysis
      </div>

      <div className="px-4 max-w-3xl mx-auto">
        {/* chart or “no data” banner */}
        <div className="relative h-72 sm:h-96 flex items-center justify-center">
          {hasData ? (
            <Bar
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false, labels: { font: boldFont } },
                  tooltip: {
                    mode: "index",
                    intersect: false,
                    titleFont: boldFont,
                    bodyFont: boldFont,
                  },
                },
                scales: {
                  x: { ticks: { font: boldFont } },
                  y: {
                    beginAtZero: true,
                    ticks: { stepSize: 25, font: boldFont },
                    title: {
                      display: true,
                      text: "% area with water",
                      font: boldFont,
                    },
                  },
                },
              }}
            />
          ) : (
            <span className="text-gray-500 font-bold text-lg">
              No data available
            </span>
          )}
        </div>

        {/* year slider */}
        <div className="mt-6 w-3/4 max-w-lg mx-auto">
          <input
            type="range"
            min="0"
            max={years.length - 1}
            step="1"
            value={idx}
            onChange={(e) => setIdx(Number(e.target.value))}
            className="w-full accent-[#592941]"
          />
          <div className="flex justify-between text-gray-700 text-xs mt-1 px-1 font-bold">
            {years.map((y) => (
              <span key={y} className="flex-1 text-center">
                {y}
              </span>
            ))}
          </div>
        </div>

        {/* acreage circle */}
        <div className="flex justify-center mt-8">
          <div className="w-32 h-32 rounded-full bg-sky-500 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg text-center leading-tight">
              {acreage}
              <br />
              acres
            </span>
          </div>
        </div>

        {/* paragraph */}
        <div className="mt-8 mx-auto max-w-prose px-4 text-[#374151] leading-relaxed tracking-wide">
          <p className="text-sm sm:text-sm">
            {
              "This shows the area of the water body where water was present during the Kharif season coinciding with the monsoons, the area during Rabi season post‑monsoon, and the area during the Zaid summer season. Water bodies that were filling up earlier but are lately not filling up may need some repair work like desilting or cleaning up of inlet channels to collect runoff. You can use the slider to move across different years."
            }
          </p>
        </div>
      </div>
    </>
  );
};

export default SurfaceWaterBodies;
