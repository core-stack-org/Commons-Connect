import React, { useState } from "react";
import useMainStore from "../store/MainStore.jsx";
import getOdkUrlForScreen from "../action/getOdkUrl.js";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Agriculture = () => {
  const MainStore = useMainStore((state) => state);
  const navigate  = useNavigate();
  const { t } = useTranslation();

/* ─── Year‑slider setup ───────────────────────────────────── */
    const years = [
        "17-18",
        "18-19",
        "19-20",
        "20-21",
        "21-22",
        "22-23",
        "23-24",
    ];
    const [dragging, setDrag] = useState(false);
    
    const handleYearChange = (e) => {
        MainStore.setLulcYearIdx(Number(e.target.value));
    }
    const percent = (MainStore.lulcYearIdx / (years.length - 1)) * 100;    // 0 – 100 %
  

  const toggleFormsUrl = (toggle) => {
    let gpsCoords = MainStore.gpsLocation

      if(gpsCoords === null){
        try{
          navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
              gpsCoords = [coords.longitude, coords.latitude];
            },
            (err) => {
              console.log("In first err : ", err)
            }
          );
          if(gpsCoords === null){
            throw new Error('User object missing');
          }
        }catch(e){
          console.log("In the catch ")
        }
        MainStore.setGpsLocation(gpsCoords)
      }
    if (MainStore.markerCoords) {
      MainStore.setIsForm(true);
      MainStore.setFormUrl(
        getOdkUrlForScreen(
          MainStore.currentScreen,
          MainStore.currentStep,
          MainStore.markerCoords,
          MainStore.settlementName,
          "",
          MainStore.blockName,
          MainStore.currentPlan.plan_id,
          MainStore.currentPlan.plan,
          "",
          toggle,
          gpsCoords
        )
      );
      MainStore.setIsOpen(true);
    }
  };

  const handleAssetInfo = () => {
    MainStore.setIsOpen(true)
  }

  const getPlanLabel = () => {
    const plan = MainStore.currentPlan?.plan ?? "Select Plan";
  
    // Helper function to capitalize each word
    const capitalizeWords = (str) => {
      return str.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    };
  
    const words = plan.trim().split(/\s+/);
    if (words.length > 15) {
      return capitalizeWords(words.slice(0, 15).join(' ') + '…');
    }
    return capitalizeWords(plan);
  };

  const handleAnalyze = () =>{
    MainStore.setIsAgriculture(true)
    MainStore.setIsOpen(true)
  }

  return (
    <>
      {/* Title Bubble (UNCHANGED) */}
      <div className="absolute top-4 left-0 w-full px-4 z-10 pointer-events-none">
        <div className="relative w-full max-w-lg mx-auto flex items-center">
          <div className="flex-1 px-6 py-3 text-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-extrabold text-md shadow-md">
            {t("Agriculture")}
          </div>
        </div>
      </div>

      {/* 2. Top-left buttons */}
      <div className="absolute top-20 left-0 w-full px-4 z-10 flex justify-start pointer-events-auto">
            <div className="flex gap-4 max-w-lg">
            <div className="flex flex-col gap-3">
                {/* GPS Button */}
                <button
                className="flex-shrink-0 w-9 h-9 rounded-md shadow-sm flex items-center justify-center"
                style={{
                    backgroundColor: '#D6D5C9',
                    color: '#592941',
                    border: 'none',
                    backdropFilter: 'none',
                }}
                onClick={() => {
                  MainStore.setIsGPSClick(!MainStore.isGPSClick)}}
                >
                <svg viewBox="-16 0 130 130" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="50" cy="130" rx="18" ry="6" fill="#00000010" />
                  <path d="M50 20 C70 20 85 35 85 55 C85 75 50 110 50 110 C50 110 15 75 15 55 C15 35 30 20 50 20 Z" 
                        fill="#592941" 
                        stroke="#592941" 
                        strokeWidth="1.5"/>
                  <circle cx="50" cy="55" r="16" fill="#FFFFFF" stroke="#1E40AF" strokeWidth="1.5"/>
                  <circle cx="50" cy="55" r="6" fill="#592941"/>
                  <ellipse cx="46" cy="38" rx="6" ry="10" fill="#FFFFFF25" />
                </svg>
                </button>
                
                {/* INFO Button */}
                <button
                    className="w-9 h-9 rounded-md shadow-sm flex items-center justify-center"
                    style={{ backgroundColor: '#D6D5C9', color: '#592941', border: 'none' }}
                    onClick={() => MainStore.setIsInfoOpen(true)}
                >
                    <svg viewBox="-16 0 130 100" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="40" fill="#592941" stroke="#592941" strokeWidth="2"/>

                        <circle cx="50" cy="50" r="36" fill="#592941"/>

                        <circle cx="50" cy="35" r="4" fill="#FFFFFF"/>

                        <rect x="46" y="45" width="8" height="25" rx="4" fill="#FFFFFF"/>

                        <ellipse cx="42" cy="42" rx="8" ry="12" fill="#FFFFFF20"/>
                      </svg>
                </button>
                </div>

                {/* Plan selector with dropdown */}
                <div className="relative">
                <button
                    className="flex-1 px-3 py-2 rounded-xl shadow-sm text-sm"
                    style={{
                    backgroundColor: '#D6D5C9',
                    color: '#592941',
                    border: 'none',
                    backdropFilter: 'none',
                    }}
                >
                    {getPlanLabel()}
                </button>
                  <button
                      className="flex-1 px-3 py-2 rounded-xl shadow-sm text-sm ml-2"
                      style={{
                        backgroundColor: '#D6D5C9',
                        color: '#592941',
                        border: 'none',
                        backdropFilter: 'none',
                      }}
                      onClick={() =>{
                        MainStore.setIsAgriculture(false)
                        MainStore.setIsLayerStore(true)
                        MainStore.setIsOpen(true)
                      }}
                      >
                      {"Layers"}
                  </button>
                </div>
            </div>
      </div>

     {/* ─── Slider + popup (step 0 only) - MOVED FURTHER DOWN TO AVOID OVERLAP ─── */}
     {MainStore.currentStep === 0 && (
        <div className="absolute top-44 left-0 w-full px-4 z-10">
            <div className="relative w-3/4 max-w-md mx-auto">
            <input
                type="range"
                min="0"
                max={years.length - 1}          // 0 … 6
                step="1"
                value={MainStore.lulcYearIdx}
                onChange={handleYearChange}
                onMouseDown={() => setDrag(true)}
                onMouseUp={() => setDrag(false)}
                onTouchStart={() => setDrag(true)}
                onTouchEnd={() => setDrag(false)}
                className="w-full accent-[#592941]"
            />

            {/* floating label */}
            {(dragging || true) && (
                <div
                className="absolute -top-8 px-2 py-1 rounded-md text-xs font-semibold text-white bg-black/60 pointer-events-none"
                style={{
                    left: `calc(${percent}% )`,
                    transform: "translateX(-50%)",
                    backdropFilter: "blur(2px)",
                }}
                >
                {years[MainStore.lulcYearIdx]}
                </div>
            )}
            </div>
        </div>
        )}

      {/* Bottom Controls (UNCHANGED) */}
      <div className="absolute bottom-13 left-0 w-full px-4 z-10 pointer-events-auto">
        {MainStore.currentStep === 0 && !MainStore.isFeatureClicked && (
          <div className="flex flex-col items-center justify-center w-full gap-3">
            {/* Analyze Button - Top pill */}
            <div className="flex items-center justify-center w-full">
              <button
                className="px-6 py-3 text-sm font-medium flex items-center justify-center"
                onClick={() => handleAnalyze()}
                disabled={!MainStore.isMarkerPlaced}
                style={{
                  backgroundColor: !MainStore.isMarkerPlaced ? '#696969' : '#D6D5C9',
                  color: !MainStore.isMarkerPlaced ? '#A8A8A8' : '#592941',
                  border: 'none',
                  borderRadius: '22px',
                  height: '44px',
                  width: '280px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  cursor: !MainStore.isMarkerPlaced ? 'not-allowed' : 'pointer',
                  transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {t("Analyze")}
              </button>
            </div>

            {/* Start Planning Button - Bottom pill */}
            <div className="flex items-center justify-center w-full">
              <button
                className="px-6 py-3 text-sm font-medium flex items-center justify-center"
                onClick={() => MainStore.setCurrentStep(1)}
                disabled={!MainStore.isMarkerPlaced}
                style={{
                  backgroundColor: !MainStore.isMarkerPlaced ? '#696969' : '#D6D5C9',
                  color: !MainStore.isMarkerPlaced ? '#A8A8A8' : '#592941',
                  border: 'none',
                  borderRadius: '22px',
                  height: '44px',
                  width: '280px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  cursor: !MainStore.isMarkerPlaced ? 'not-allowed' : 'pointer',
                  transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {t("Start Planning")}
              </button>
            </div>
          </div>
        )}

        {MainStore.currentStep === 0 && MainStore.isFeatureClicked && (
          <div className="flex flex-col items-center justify-center w-full gap-3">
            {/* Asset Info Button - Top pill */}
            <div className="flex items-center justify-center w-full">
              <button
                className="px-6 py-3 text-sm font-medium flex items-center justify-center"
                onClick={handleAssetInfo}
                disabled={!MainStore.isMarkerPlaced}
                style={{
                  backgroundColor: !MainStore.isMarkerPlaced ? '#696969' : '#D6D5C9',
                  color: !MainStore.isMarkerPlaced ? '#A8A8A8' : '#592941',
                  border: 'none',
                  borderRadius: '22px',
                  height: '44px',
                  width: '280px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  cursor: !MainStore.isMarkerPlaced ? 'not-allowed' : 'pointer',
                  transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {t("Asset Info")}
              </button>
            </div>

            {/* Start Planning Button - Bottom pill */}
            <div className="flex items-center justify-center w-full">
              <button
                className="px-6 py-3 text-sm font-medium flex items-center justify-center"
                onClick={() => MainStore.setCurrentStep(1)}
                disabled={!MainStore.isMarkerPlaced}
                style={{
                  backgroundColor: !MainStore.isMarkerPlaced ? '#696969' : '#D6D5C9',
                  color: !MainStore.isMarkerPlaced ? '#A8A8A8' : '#592941',
                  border: 'none',
                  borderRadius: '22px',
                  height: '44px',
                  width: '280px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  cursor: !MainStore.isMarkerPlaced ? 'not-allowed' : 'pointer',
                  transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {t("Start Planning")}
              </button>
            </div>
          </div>
        )}

        {MainStore.currentStep === 1 && (
          <div className="flex flex-col gap-4 w-full">
            {/* Propose Maintenance Button - Top pill */}
            <div className="flex items-center justify-center w-full">
              <button
                className="px-6 py-3 text-sm font-medium flex items-center justify-center"
                onClick={() => toggleFormsUrl(true)}
                disabled={!MainStore.isFeatureClicked}
                style={{
                  backgroundColor: !MainStore.isFeatureClicked ? '#696969' : '#D6D5C9',
                  color: !MainStore.isFeatureClicked ? '#A8A8A8' : '#592941',
                  border: 'none',
                  borderRadius: '22px',
                  height: '44px',
                  width: '320px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  cursor: !MainStore.isFeatureClicked ? 'not-allowed' : 'pointer',
                  transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {t("Propose Maintenance")}
              </button>
            </div>

            {/* Bottom pill with back, Propose new Irrigation Work, and finish */}
            <div className="flex items-center justify-center w-full">
              <div 
                className="flex items-center justify-between px-4 py-3"
                style={{
                  backgroundColor: '#D6D5C9',
                  borderRadius: '22px',
                  height: '44px',
                  width: '320px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {/* Back Button */}
                <button
                  className="flex items-center justify-center"
                  onClick={() => {
                    let BACK = MainStore.currentStep - 1;
                    if(MainStore.currentStep) {
                      MainStore.setCurrentStep(BACK);
                    }
                  }}
                  style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '18px',
                    color: '#592941',
                    cursor: 'pointer',
                    transition: 'background-color 200ms'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>‹</span>
                </button>

                {/* Propose new Irrigation Work Button */}
                <button
                  className="flex-1 mx-3 px-4 text-sm font-medium flex items-center justify-center"
                  onClick={() => toggleFormsUrl(false)}
                  disabled={MainStore.isFeatureClicked}
                  style={{
                    backgroundColor: MainStore.isFeatureClicked ? '#D6D5C9' : '#D6D5C9',
                    color: MainStore.isFeatureClicked ? '#A8A8A8' : '#592941',
                    border: 'none',
                    borderRadius: '16px',
                    height: '32px',
                    cursor: MainStore.isFeatureClicked ? 'not-allowed' : 'pointer',
                    transition: 'all 200ms'
                  }}
                >
                  {t("New Irrigation Work")}
                </button>

                {/* Finish Button */}
                <button
                  className="flex items-center justify-center"
                  onClick={() => navigate("/maps")}
                  style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '18px',
                    color: '#592941',
                    cursor: 'pointer',
                    transition: 'background-color 200ms'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>✓</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Agriculture;