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
import { useTranslation } from "react-i18next";
import getOdkUrlForScreen from "../../action/getOdkUrl"

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// 2017 → "2017-18"
const agrFullLabel = (y) => `${y}-${String(y + 1).slice(-2)}`;

// 2017 → "17-18"  (matches data keys: k_17-18, kr_17-18 …)
const agrShortKey = (y) => `${String(y).slice(-2)}-${String(y + 1).slice(-2)}`;

// 2017 → "'17-18"  (compact slider tick)
const agrShortLabel = (y) => `'${agrShortKey(y)}`;

const YEARS = [2017, 2018, 2019, 2020, 2021, 2022, 2023];

const SurfaceWaterBodies = () => {
  const [idx, setIdx] = useState(YEARS.length - 1);
  const year = YEARS[idx];
  const yearKey = agrShortKey(year);
  const MainStore = useMainStore((s) => s);
  const { t } = useTranslation();

  /* acreage (area_ored hectares → acres) */
  const acreage = useMemo(() => {
    const hectare = Number(MainStore.selectedResource?.area_ored ?? 0);
    return (hectare * 2.47105).toFixed(2);
  }, [MainStore.selectedResource]);

  /* chart data + zero check */
  const { chartData, isZero } = useMemo(() => {
    const safe = (k) => Number(MainStore.selectedResource?.[k] ?? 0);
    const dataArr = [
      safe(`k_${yearKey}`),
      safe(`kr_${yearKey}`),
      safe(`krz_${yearKey}`),
    ];
    return {
      chartData: {
        labels: [t("Kharif"), t("Kharif-Rabi"), t("Kharif-Rabi-Zaid")],
        datasets: [
          {
            label: agrFullLabel(year),
            backgroundColor: ["#E38627", "#C13C37", "#6A2135"],
            borderRadius: 4,
            data: dataArr,
          },
        ],
      },
      isZero: dataArr.every((v) => v === 0),
    };
  }, [idx, MainStore.selectedResource, yearKey, year, t]);

  const toggleFormsUrl = () => {
    MainStore.setIsForm(true)
    MainStore.setFormUrl(getOdkUrlForScreen(MainStore.currentScreen, MainStore.currentStep, MainStore.markerCoords, "", "", MainStore.blockName, MainStore.currentPlan.plan_id, MainStore.currentPlan.plan, "", !MainStore.isWaterbody, [0,0], true))
  }

  const boldFont = { weight: "bold" };

  return (
    <>
      {/* title */}
      <div className="sticky top-12 z-10 bg-white text-center pt-8 text-xl font-bold text-gray-800 border-b border-gray-300 shadow-md pb-2 mb-6">
        {t("swb_heading")}
      </div>

      <div className="px-4 max-w-3xl mx-auto">
        {/* chart */}
        <div className="relative h-72 sm:h-96 flex items-center justify-center">
          {isZero ? (
            <span className="text-gray-500 font-semibold">
              {t("swb_no_data") || t("The data for this year is Zero")}
            </span>
          ) : (
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
                    min: 0,
                    max: 100,
                    ticks: { 
                      stepSize: 25,
                      font: boldFont,
                      callback: function(value) {
                        return value + '%';
                      }
                    },
                    title: {
                      display: true,
                      text: t("swb_chart_title"),
                      font: boldFont,
                    },
                  },
                },
              }}
            />
          )}
        </div>

        {/* year slider */}
        <div className="w-full max-w-md mx-auto pt-4 pb-8 px-4">
          <div className="text-center mb-4">
            <span className="text-2xl font-bold text-[#592941]">
              {agrFullLabel(year)}
            </span>
          </div>

          <div className="relative mb-2">
            <div className="flex justify-between relative">
              {YEARS.map((y, index) => {
                const showLabel = index === 0 || index === YEARS.length - 1 || index === idx;
                return (
                  <div key={y} className="flex flex-col items-center relative flex-1">
                    <div
                      className={`w-0.5 transition-all duration-200 ${
                        index === idx ? "h-4 bg-[#592941]" : "h-2 bg-gray-400"
                      }`}
                    />
                    {showLabel && (
                      <span
                        className={`text-xs font-medium mt-1 transition-colors duration-200 ${
                          index === idx ? "text-[#592941] font-bold" : "text-gray-500"
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
            step="1"
            value={idx}
            onChange={(e) => setIdx(Number(e.target.value))}
            className="w-full accent-[#592941] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-swb"
          />

          <style jsx>{`
            .slider-swb::-webkit-slider-thumb {
              appearance: none;
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: #592941;
              cursor: pointer;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            .slider-swb::-moz-range-thumb {
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: #592941;
              cursor: pointer;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
          `}</style>
        </div>

        {/* acreage chip */}
        <div className="flex justify-center mt-8">
          <div className="rounded-xl bg-[#f8fafc] border border-gray-200 py-2 px-6 text-center shadow-sm">
            <div className="text-xs tracking-wide text-gray-500 mb-1">
              {t("Area")}
            </div>
            <div className="text-lg font-bold">{acreage} acres</div>
          </div>
        </div>

        {/* paragraph */}
        <div className="mt-8 mx-auto max-w-prose px-4 text-[#374151] leading-relaxed tracking-wide">
          <p className="text-sm sm:text-sm">{t("info_swb_modal_1")}</p>
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
      </div>
    </>
  );
};

export default SurfaceWaterBodies;
