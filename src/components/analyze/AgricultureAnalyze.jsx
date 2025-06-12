import React, { useState, useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';
import useMainStore from "../../store/MainStore";
import { useTranslation } from "react-i18next";

const YEARS = [2017, 2018, 2019, 2020, 2021, 2022];

const CAPSULE_KEYS = ["Mild Drought", "Moderate Drought", "Severe Drought", "Dry Spells", "Cropping Intensity"];

/* pretty-print */
const fmt = (v, d = 0) =>
  v !== undefined
    ? Number(v).toLocaleString("en-IN", { maximumFractionDigits: d })
    : "—";

const AgricultureAnalyze = () => {
  const [idx, setIdx] = useState(YEARS.length - 1);
  const year = YEARS[idx];
  
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const cropChartRef = useRef(null);
  const cropChartInstanceRef = useRef(null);
  const lineChartRef = useRef(null);
  const lineChartInstanceRef = useRef(null);

  const { t } = useTranslation();

  const selectedMWSDrought = useMainStore((state) => state.selectedMWSDrought);
  const selectedResource = useMainStore((state) => state.selectedResource);

  const annual = useMemo(() => {
    const drlbKey = `drlb_${year}`;
    const dryspKey = `drysp_${year}`;

    if (!selectedMWSDrought || !selectedMWSDrought[drlbKey]) {
        return {};
    }

    const drlbArray = JSON.parse(selectedMWSDrought[drlbKey] || '[]');
    const mildCount = drlbArray.filter((v) => v === 1).length;
    const moderateCount = drlbArray.filter((v) => v === 2).length;
    const severeCount = drlbArray.filter((v) => v === 3).length;
    const dryspellCount = selectedMWSDrought[dryspKey] || 0;

    const cropIntensityIdx = YEARS.indexOf(year) + 1;
    const cropIntensity = selectedResource ? (selectedResource[`cropping_${cropIntensityIdx}`] || 0) : 0;

    return {
        "Mild Drought": mildCount,
        "Moderate Drought": moderateCount,
        "Severe Drought": severeCount,
        "Dry Spells": dryspellCount,
        "Cropping Intensity": cropIntensity,
    };
  }, [year, selectedMWSDrought, selectedResource]);

  const hasAnnual = Object.keys(annual).length > 0;
  const hasDroughtData = hasAnnual && (annual["Mild Drought"] > 0 || annual["Moderate Drought"] > 0 || annual["Severe Drought"] > 0 || annual["Dry Spells"] > 0);

  // Drought chart effect
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
      labels: ['Mild', 'Moderate', 'Severe', 'Dryspell'],
      datasets: [
        {
          label: `Drought Frequency (${year})`,
          data: [
            annual["Mild Drought"], 
            annual["Moderate Drought"], 
            annual["Severe Drought"], 
            annual["Dry Spells"]
          ],
          backgroundColor: ['#F4D03F', '#EB984E', '#E74C3C', '#8884d8'],
          borderRadius: 6,
          borderWidth: 0,
        },
      ],
    };

    const ctx = chartRef.current.getContext('2d');
    if (chartInstanceRef.current) {
      chartInstanceRef.current.data = data;
      chartInstanceRef.current.options.scales.x.title.text = `Year: ${year}`;
      chartInstanceRef.current.update();
    } else {
      chartInstanceRef.current = new Chart(ctx, {
        type: 'bar',
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { 
            y: { 
              beginAtZero: true, 
              ticks: { precision: 0 },
              title: { display: true, text: 'Drought Frequency (# weeks)' }
            },
            x: {
              title: { display: true, text: `Year: ${year}` }
            }
          },
          plugins: { 
            legend: { display: false },
          },
        },
      });
    }
  }, [year, annual, hasDroughtData]);

  // Cropping intensity chart effect
  useEffect(() => {
    if (!cropChartRef.current) return;

    const cropIdx = YEARS.indexOf(year) + 1;
    const totalCrop = selectedResource.total_crop || 0;
    const single = selectedResource[`single_c_${cropIdx}`] || 0;
    const doubled = selectedResource[`doubly_c_${cropIdx}`] || 0;
    const tripled = selectedResource[`triply_c_${cropIdx}`] || 0;

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
    const uncroppedPct = Math.max(0, 100 - (singlePct + doublePct + triplePct));

    const data = {
      labels: [`${year}`],
      datasets: [
        { label: 'Single', data: [singlePct.toFixed(1)], backgroundColor: '#57ad2b', borderRadius: 4 },
        { label: 'Double', data: [doublePct.toFixed(1)], backgroundColor: '#e68600', borderRadius: 4 },
        { label: 'Triple', data: [triplePct.toFixed(1)], backgroundColor: '#b3561d', borderRadius: 4 },
        { label: 'Uncropped', data: [uncroppedPct.toFixed(1)], backgroundColor: '#A9A9A9', borderRadius: 4 },
      ],
    };

    const ctx2 = cropChartRef.current.getContext('2d');
    if (cropChartInstanceRef.current) {
      cropChartInstanceRef.current.data = data;
      cropChartInstanceRef.current.update();
    } else {
      cropChartInstanceRef.current = new Chart(ctx2, {
        type: 'bar',
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
              ticks: { callback: (v) => v + '%' },
              title: { display: true, text: 'Cropping Patterns' }
            },
          },
        },
      });
    }
  }, [year, selectedResource]);

  // Line chart effect
  useEffect(() => {
    if (!lineChartRef.current) return;
    const dataPoints = YEARS.map((_, i) => selectedResource[`cropping_${i + 1}`] || 0);
    const data = {
      labels: YEARS.map(String),
      datasets: [
        {
          label: 'Cropping Intensity',
          data: dataPoints,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointBackgroundColor: '#3B82F6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          borderWidth: 3,
        },
      ],
    };
    const ctx3 = lineChartRef.current.getContext('2d');
    if (lineChartInstanceRef.current) {
      lineChartInstanceRef.current.data = data;
      lineChartInstanceRef.current.update();
    } else {
      lineChartInstanceRef.current = new Chart(ctx3, {
        type: 'line',
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { 
            y: { 
              beginAtZero: true, 
              ticks: { precision: 0 },
              title: { display: true, text: 'Cropping Intensity' }
            },
          },
        },
      });
    }
  }, [selectedResource]);

  return (
    <>
      <div className="sticky top-0 z-20 bg-white text-center pt-8 text-xl font-bold text-gray-800 border-b border-gray-300 shadow-md pb-2">
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
                <div className="text-lg font-bold">{fmt(annual[k], k === 'Cropping Intensity' ? 1 : 0)}{k === 'Cropping Intensity' ? '%' : ' weeks'}</div>
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
            <p className="text-center text-gray-500 py-10">{t("No data available")}</p>
          )}
        </section>

        {/* year slider */}
        <div className="w-3/4 max-w-lg mx-auto pt-4 pb-8">
            <input
                type="range"
                min="0"
                max={YEARS.length - 1}
                value={idx}
                onChange={(e) => setIdx(Number(e.target.value))}
                className="w-full accent-[#0f766e]"
            />
            <div className="flex justify-between text-sm font-bold mt-1">
                {YEARS.map((y) => (
                <span key={y} className="flex-1 text-center">
                    {y}
                </span>
                ))}
            </div>
        </div>
        
        {/* Cropping Pattern chart */}
        <section>
          <h2 className="font-bold text-gray-700 mb-2">
            {t("cropping_in_header")} ({year})
          </h2>
          {(selectedResource.total_crop > 0) ? (
            <div className="relative h-72">
              <canvas ref={cropChartRef} />
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10">{t("No data available")}</p>
          )}
        </section>

        {/* Cropping Intensity Trend chart */}
        <section>
          <h2 className="font-bold text-gray-700 mb-2">
            {t("Cropping Intensity Trend (2017-2022)")}
          </h2>
          {(selectedResource.total_crop > 0) ? (
            <div className="relative h-72">
              <canvas ref={lineChartRef} />
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10">{t("No data available")}</p>
          )}
        </section>

        {/* Explanation Section */}
        <section className="space-y-8 text-sm leading-relaxed text-gray-700 mt-8 pt-8 border-t">
          <div>
            <h3 className="font-bold mb-2">{t("drought_header")}</h3>
            <p>{t("info_agri_modal_1")}</p>
          </div>
          <div>
            <h3 className="font-bold mb-2">{t("cropping_in_header")}</h3>
            <p>{t("info_agri_modal_2")}</p>
          </div>
        </section>
      </div>
    </>
  );
};

export default AgricultureAnalyze;