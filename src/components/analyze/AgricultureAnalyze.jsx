import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import useMainStore from "../../store/MainStore";
import { useTranslation } from "react-i18next";

const YEARS = [2017, 2018, 2019, 2020, 2021, 2022];

const AgricultureAnalyze = () => {
  const [year, setYear] = useState(2017);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const cropChartRef = useRef(null);
  const cropChartInstanceRef = useRef(null);
  const lineChartRef = useRef(null);
  const lineChartInstanceRef = useRef(null);

  const { t } = useTranslation();

  const selectedMWSDrought = useMainStore((state) => state.selectedMWSDrought);
  const selectedResource = useMainStore((state) => state.selectedResource);

  // Drought chart effect
  useEffect(() => {
    const drlbKey = `drlb_${year}`;
    const dryspKey = `drysp_${year}`;

    const drlbArray = JSON.parse(selectedMWSDrought[drlbKey] || '[]');
    const mildCount = drlbArray.filter((v) => v === 1).length;
    const moderateCount = drlbArray.filter((v) => v === 2).length;
    const severeCount = drlbArray.filter((v) => v === 3).length;
    const dryspellCount = selectedMWSDrought[dryspKey] || 0;

    const totalCount = mildCount + moderateCount + severeCount + dryspellCount;
    if (totalCount === 0) {
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
          data: [mildCount, moderateCount, severeCount, dryspellCount],
          backgroundColor: ['#60A5FA', '#FBBF24', '#EF4444', '#9CA3AF'],
          borderRadius: 6,
          borderWidth: 0,
        },
      ],
    };

    const ctx = chartRef.current.getContext('2d');
    if (chartInstanceRef.current) {
      chartInstanceRef.current.data = data;
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
              grid: { color: 'rgba(0,0,0,0.05)' }
            },
            x: {
              grid: { display: false }
            }
          },
          plugins: { 
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(0,0,0,0.8)',
              titleColor: 'white',
              bodyColor: 'white',
              cornerRadius: 8
            }
          },
        },
      });
    }
  }, [year, selectedMWSDrought]);

  // Cropping intensity chart effect
  useEffect(() => {
    const idx = YEARS.indexOf(year) + 1;
    const totalCrop = selectedResource.total_crop || 0;
    const single = selectedResource[`single_c_${idx}`] || 0;
    const doubled = selectedResource[`doubly_c_${idx}`] || 0;
    const tripled = selectedResource[`triply_c_${idx}`] || 0;
    const singlePct = totalCrop ? (single / totalCrop) * 100 : 0;
    const doublePct = totalCrop ? (doubled / totalCrop) * 100 : 0;
    const triplePct = totalCrop ? (tripled / totalCrop) * 100 : 0;
    const uncroppedPct = Math.max(0, 100 - (singlePct + doublePct + triplePct));

    const data = {
      labels: [`${year}`],
      datasets: [
        { label: 'Single', data: [singlePct.toFixed(1)], backgroundColor: '#34D399', borderRadius: 4 },
        { label: 'Double', data: [doublePct.toFixed(1)], backgroundColor: '#60A5FA', borderRadius: 4 },
        { label: 'Triple', data: [triplePct.toFixed(1)], backgroundColor: '#FBBF24', borderRadius: 4 },
        { label: 'Uncropped', data: [uncroppedPct.toFixed(1)], backgroundColor: '#9CA3AF', borderRadius: 4 },
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
              grid: { display: false }
            },
            y: { 
              stacked: true, 
              beginAtZero: true, 
              max: 100, 
              ticks: { callback: (v) => v + '%' },
              grid: { color: 'rgba(0,0,0,0.05)' }
            },
          },
          plugins: {
            tooltip: {
              backgroundColor: 'rgba(0,0,0,0.8)',
              titleColor: 'white',
              bodyColor: 'white',
              cornerRadius: 8
            }
          }
        },
      });
    }
  }, [year, selectedResource]);

  // Line chart effect
  useEffect(() => {
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
              grid: { color: 'rgba(0,0,0,0.05)' }
            },
            x: {
              grid: { color: 'rgba(0,0,0,0.05)' }
            }
          },
          plugins: {
            tooltip: {
              backgroundColor: 'rgba(0,0,0,0.8)',
              titleColor: 'white',
              bodyColor: 'white',
              cornerRadius: 8
            }
          }
        },
      });
    }
  }, [selectedResource]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="text-center py-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {t("agri_heading")}
          </h1>
          <div className="w-16 h-0.5 bg-blue-500 mx-auto rounded-full"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Drought Frequency Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
            <div className="flex items-center">
              <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
              <h2 className="text-xl font-semibold text-gray-800">
                {t("drought_header")}
              </h2>
            </div>
          </div>
          
          <div className="p-6">
            {/* Chart Container */}
            <div className="relative h-72 bg-gray-50/50 rounded-xl p-4 mb-6">
              {(() => {
                const drlbKey = `drlb_${year}`;
                const dryspKey = `drysp_${year}`;
                const drlbArray = JSON.parse(selectedMWSDrought[drlbKey] || '[]');
                const mildCount = drlbArray.filter((v) => v === 1).length;
                const moderateCount = drlbArray.filter((v) => v === 2).length;
                const severeCount = drlbArray.filter((v) => v === 3).length;
                const dryspellCount = selectedMWSDrought[dryspKey] || 0;
                const totalCount = mildCount + moderateCount + severeCount + dryspellCount;
                
                return totalCount > 0 ? (
                  <canvas ref={chartRef} className="w-full h-full" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-medium">{t("No data available")}</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-blue-800 text-sm leading-relaxed">
                  {t("info_agri_modal_1")}
                </p>
              </div>
            </div>

            {/* Enhanced Year Slider */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="font-semibold text-gray-700 min-w-fit">{t("Year")}:</span>
                <div className="flex-1 relative">
                  <input
                    type="range"
                    min={YEARS[0]}
                    max={YEARS[YEARS.length - 1]}
                    step="1"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                  <div className="flex justify-between mt-2 px-1">
                    {YEARS.map((yr) => (
                      <span 
                        key={yr} 
                        className={`text-xs font-medium transition-colors ${
                          yr === year ? 'text-blue-600' : 'text-gray-400'
                        }`}
                      >
                        {yr}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-bold min-w-fit">
                  {year}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cropping Intensity Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-100">
            <div className="flex items-center">
              <div className="w-1 h-6 bg-green-500 rounded-full mr-3"></div>
              <h2 className="text-xl font-semibold text-gray-800">
                {t("cropping_in_header")}
              </h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="relative h-72 bg-gray-50/50 rounded-xl p-4">
              <canvas ref={cropChartRef} className="w-full h-full" />
            </div>
          </div>
        </div>

        {/* Trend Analysis Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-100">
            <div className="flex items-center">
              <div className="w-1 h-6 bg-purple-500 rounded-full mr-3"></div>
              <h2 className="text-xl font-semibold text-gray-800">
                {t("cropping_in_header")}
              </h2>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="relative h-72 bg-gray-50/50 rounded-xl p-4">
              <canvas ref={lineChartRef} className="w-full h-full" />
            </div>
            
            {/* Info Box */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-purple-800 text-sm leading-relaxed">
                  {t("info_agri_modal_2")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgricultureAnalyze;