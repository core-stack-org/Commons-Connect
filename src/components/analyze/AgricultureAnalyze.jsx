import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import useMainStore from "../../store/MainStore";

const YEARS = [2017, 2018, 2019, 2020, 2021, 2022];

const AgricultureAnalyze = () => {
  const [year, setYear] = useState(2017);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const cropChartRef = useRef(null);
  const cropChartInstanceRef = useRef(null);
  const lineChartRef = useRef(null);
  const lineChartInstanceRef = useRef(null);

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
          borderRadius: 4,
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
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
          plugins: { legend: { display: false } },
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
        { label: 'Single', data: [singlePct.toFixed(1)], backgroundColor: '#34D399' },
        { label: 'Double', data: [doublePct.toFixed(1)], backgroundColor: '#60A5FA' },
        { label: 'Triple', data: [triplePct.toFixed(1)], backgroundColor: '#FBBF24' },
        { label: 'Uncropped', data: [uncroppedPct.toFixed(1)], backgroundColor: '#9CA3AF' },
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
            x: { stacked: true },
            y: { stacked: true, beginAtZero: true, max: 100, ticks: { callback: (v) => v + '%' } },
          },
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
          backgroundColor: '#3B82F6',
          fill: false,
          tension: 0.3,
          pointRadius: 4,
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
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        },
      });
    }
  }, [selectedResource]);

  return (
    <>
      <div className="sticky top-0 z-20 bg-white text-center pt-8 text-xl font-bold text-gray-800 border-b border-gray-300 shadow-md pb-2">
        Agriculture Analysis
      </div>

      <div className="p-6 max-w-3xl mx-auto space-y-8">
      <h3 className="text-lg font-semibold text-gray-800">Drought Frequency</h3>
        {/* Drought Chart */}
        <div className="relative h-64 flex items-center justify-center">
          {(() => {
            const drlbKey = `drlb_${year}`;
            const dryspKey = `drysp_${year}`;
            const drlbArray = JSON.parse(selectedMWSDrought[drlbKey] || '[]');
            const mildCount = drlbArray.filter((v) => v === 1).length;
            const moderateCount = drlbArray.filter((v) => v === 2).length;
            const severeCount = drlbArray.filter((v) => v === 3).length;
            const dryspellCount = selectedMWSDrought[dryspKey] || 0;
            const totalCount = mildCount + moderateCount + severeCount + dryspellCount;
            return totalCount > 0 ? <canvas ref={chartRef} /> : <div className="text-gray-500 font-semibold">No data available</div>;
          })()}
        </div>

        {/* Drought Description */}
        <div className="bg-gray-50 p-1 rounded-lg shadow-inner text-gray-700 leading-relaxed text-sm text-center">
          <p>
            This shows the number of weeks during the Kharif season under various drought conditions.
            Use the slider to change the year.
          </p>
        </div>

        {/* Year Slider */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <span className="font-medium text-gray-700">Year:</span>
            <input
              type="range"
              min={YEARS[0]}
              max={YEARS[YEARS.length - 1]}
              step="1"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: '#60A5FA' }}
            />
            <span className="w-12 text-center font-semibold text-gray-800">{year}</span>
          </div>
          <div className="flex justify-between px-1 text-xs text-gray-600">
            {YEARS.map((yr) => <span key={yr}>{yr}</span>)}
          </div>
        </div>

        {/* Cropping Intensity Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Cropping Intensity</h3>
          <div className="relative h-64">
            <canvas ref={cropChartRef} />
          </div>
        </div>

        {/* Line Chart Trend */}
        <div className="space-y-4">
          <div className="relative h-64">
            <canvas ref={lineChartRef} />
          </div>
          <div className="bg-gray-50 p-1 rounded-lg shadow-inner text-gray-700 leading-relaxed text-sm text-center">
            <p>
            This shows the cropping intensity in this area, as the percentage of cropping area that was under single cropping, double cropping, or triple cropping. Single cropping is mostly rainfed, whereas double cropping typically requires access to irrigation. Cropping intensity increase may suggest groundwater usage for irrigation, and cropping intensity decrease may suggest land degradation or drying up of aquifers for groundwater based irrigation. You can use the slider to move across different years.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AgricultureAnalyze;
