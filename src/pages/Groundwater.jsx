import { useEffect } from "react";
import useMainStore from "../store/MainStore.jsx";
import getOdkUrlForScreen from "../action/getOdkUrl.js";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Groundwater = () => {

    const STATE_MACHINE = {
        1: {
          Screen : "analyze",
        },
        2: {
          Screen : "add_maintain"
        }
    };

    const { t } = useTranslation();
    const MainStore = useMainStore((state) => state);
    const navigate = useNavigate();

    useEffect(() =>{
      MainStore.setMarkerPlaced(false)
        const handleBackButton = () => {
          let BACK = MainStore.currentStep - 1
  
          if(MainStore.currentStep){
            MainStore.setCurrentStep(BACK)
          }
        }
  
        if(MainStore.currentStep > 0)
          window.history.pushState(null, "", `#${STATE_MACHINE[MainStore.currentStep].Screen}`)
  
        window.addEventListener("popstate", handleBackButton);
  
        return () => {
          window.removeEventListener("popstate", handleBackButton);
        };
  
    },[MainStore.currentStep])

    const toggleFormsUrl = (toggle) =>{
        if(MainStore.markerCoords){
          MainStore.setIsForm(true)
          MainStore.setFormUrl(getOdkUrlForScreen(MainStore.currentScreen, MainStore.currentStep, MainStore.markerCoords, "", "", MainStore.blockName, MainStore.currentPlan.plan_id, MainStore.currentPlan.plan, "",toggle))
          MainStore.setIsOpen(true)
        }
    }

    const handleAnalyze = () =>{
      MainStore.setIsGroundWater(true)
      MainStore.setIsOpen(true)
    }

    const handleAssetInfo = () => {
      MainStore.setIsOpen(true)
    }

    const getPlanLabel = () => {
      const plan = MainStore.currentPlan?.plan ?? "Select Plan";
    
      const words = plan.trim().split(/\s+/);
      if (words.length > 15) {
        return words.slice(0, 15).join(' ') + '…';
      }
      return plan;
    };


    return(
        <>
            {/* Title Bubble */}
            <div className="absolute top-4 left-0 w-full px-4 z-10 pointer-events-none">
                <div className="relative w-full max-w-lg mx-auto flex items-center">
                    <div className="flex-1 px-6 py-3 text-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-extrabold text-md shadow-md">
                        {t("GroundWater")}
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
                    onClick={() => {}}
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
                            MainStore.setFeatureStat(false)
                            MainStore.setIsResource(false)
                            MainStore.setIsGroundWater(false)
                            MainStore.setIsLayerStore(true)
                            MainStore.setIsOpen(true)
                          }}
                      >
                          {"Layers"}
                      </button>
                </div>
              </div>
            </div>

            {/* 3. WellDepth Toggle button */}
            <div className="absolute top-31.5 right-34 px-4 z-10">
                <div className="relative w-full max-w-md mx-auto">
                  <div 
                    className={`relative inline-flex rounded-xl pb-0.5 pt-0.5 ml-2`}
                    style={{ backgroundColor: '#D6D5C9' }}
                  >
                    {/* Sliding white pill background */}
                    <div
                      className="absolute top-0.5 rounded-xl bg-white shadow-sm transition-transform duration-300 ease-in-out"
                      style={{
                        height: 'calc(100% - 4px)',
                        width: '50%',
                        transform: MainStore.selectWellDepthYear === '2018_23' ? 'translateX(100%)' : 'translateX(0%)',
                      }}
                    />
                    
                    <button
                      type="button"
                      onClick={() => MainStore.setSelectedWellDepthYear('2017_22')}
                      disabled={MainStore.currentStep > 0}
                      className={`
                        relative z-10 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200
                        ${MainStore.currentStep > 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                      `}
                      style={{ color: '#592941' }}
                    >
                      {'2017-2022'}
                    </button>
                    <button
                      type="button"
                      onClick={() => MainStore.setSelectedWellDepthYear('2018_23')}
                      disabled={MainStore.currentStep > 0}
                      className={`
                        relative z-10 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200
                        ${MainStore.currentStep > 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                      `}
                      style={{ color: '#592941' }}
                    >
                      {'2018-2023'}
                    </button>
                  </div>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-13 left-0 w-full px-4 z-10 pointer-events-auto">
                {MainStore.currentStep === 0 && (
                    <div className="flex gap-4 w-full">
                        {MainStore.isFeatureClicked ? 
                        <button
                            className="flex-1 px-4 py-3 rounded-xl shadow-sm text-sm"
                            onClick={handleAssetInfo}
                            disabled={!MainStore.isMarkerPlaced}
                            style={{
                                backgroundColor: !MainStore.isMarkerPlaced ? '#696969' : '#D6D5C9',
                                color: !MainStore.isMarkerPlaced ? '#A8A8A8' : '#592941',
                                border: 'none',
                            }}
                        >
                            {t("Asset Info")}
                        </button> 
                        : 
                        <button
                            className="flex-1 px-4 py-3 rounded-xl shadow-sm text-sm"
                            onClick={() => handleAnalyze()}
                            disabled={!MainStore.isMarkerPlaced}
                            style={{
                                backgroundColor: !MainStore.isMarkerPlaced ? '#696969' : '#D6D5C9',
                                color: !MainStore.isMarkerPlaced ? '#A8A8A8' : '#592941',
                                border: 'none',
                            }}
                        >
                            {t("Analyze")}
                        </button>}
                        <button
                            className="flex-1 px-4 py-3 rounded-xl shadow-sm text-sm"
                            onClick={() => MainStore.setCurrentStep(1)}
                            style={{ backgroundColor: '#D6D5C9', color: '#592941', border: 'none' }}
                        >
                            {t("Start Planning")}
                        </button>
                    </div>
                )}

                {MainStore.currentStep === 1 && (
                    <div className="flex flex-col gap-4 w-full">
                    
                    <div className="flex gap-4 w-full">
                      <button
                        className="flex-1 px-4 py-3 rounded-xl shadow-sm text-sm"
                        onClick={() => toggleFormsUrl(true)}
                        disabled={!MainStore.isFeatureClicked}
                        style={{
                          backgroundColor: !MainStore.isFeatureClicked ? '#696969' : '#D6D5C9',
                          color: !MainStore.isFeatureClicked ? '#A8A8A8' : '#592941',
                          border: 'none',
                        }}
                      >
                        {t("Propose Maintenance")}
                      </button>
                  
                      <button
                        className="flex-1 px-4 py-3 rounded-xl shadow-sm text-sm"
                        onClick={() => toggleFormsUrl(false)}
                        style={{  
                          backgroundColor: MainStore.isFeatureClicked ? '#696969' : '#D6D5C9',
                          color: MainStore.isFeatureClicked ? '#A8A8A8' : '#592941',
                          border: 'none', 
                        }}
                        disabled={MainStore.isFeatureClicked}
                      >
                        {t("Build New Recharge Structure")}
                      </button>
                    </div>
                  
                    {/* second row – 50 % wide & centered */}
                    <button
                      className="w-1/2 self-center px-4 py-3 rounded-xl shadow-sm text-sm"
                      onClick={() => navigate('/')} 
                      style={{ backgroundColor: '#D6D5C9', color: '#592941', border: 'none' }}
                    >
                      {t("Finish")}
                    </button>
                  </div>
                  
                )}
            </div>
        </>
    )
}

export default Groundwater