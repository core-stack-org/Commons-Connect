import { useEffect } from "react";
import useMainStore from "../store/MainStore.jsx";
import { useNavigate } from "react-router-dom";
import getOdkUrlForScreen from "../action/getOdkUrl.js";
import { useTranslation } from "react-i18next";
import Floater from "../components/Floater.jsx";

const ResourceMapping = () => {

    const { t } = useTranslation();
    const MainStore = useMainStore((state) => state);
    const navigate = useNavigate();

    const STATE_MACHINE = {
      1: {
        Screen : "add_settlement",
      },
      2: {
        Screen : "add_well"
      },
      3: {
        Screen : "add_waterbodies"
      },
      4: {
        Screen : "add_crop"
      },
    };

    useEffect(() =>{
      const handleBackButton = () => {
        let BACK = MainStore.currentStep - 1

        if(MainStore.currentStep){
          MainStore.setCurrentStep(BACK)
        }
      }

      if(MainStore.currentStep > 1)
        window.history.pushState(null, "", `#${STATE_MACHINE[MainStore.currentStep].Screen}`)

      window.addEventListener("popstate", handleBackButton);

      return () => {
        window.removeEventListener("popstate", handleBackButton);
      };

    },[MainStore.currentStep])

    const toggleFormsUrl = () =>{
      
      let gpsCoords = MainStore.gpsLocation

      if(gpsCoords === null){
        try{
          navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
              gpsCoords = [coords.longitude, coords.latitude];
            },
            (err) => console.error('Geo error:', err)
          );
        }catch(e){
          navigator.geolocation.getCurrentPosition(
            ( coords ) => {
              gpsCoords = [coords.longitude, coords.latitude];
            },
            (err) => console.error('Geo error:', err)
          );
        }
        MainStore.setGpsLocation(gpsCoords)
      }

      if(MainStore.markerCoords){
        MainStore.setIsForm(true)

        MainStore.setFormUrl(getOdkUrlForScreen(MainStore.currentScreen, MainStore.currentStep, MainStore.markerCoords, MainStore.settlementName, "", MainStore.blockName, MainStore.currentPlan.plan_id, MainStore.currentPlan.plan, MainStore.selectedResource?.id, false, gpsCoords))
        
        MainStore.setIsOpen(true)
      }
    }

    // Wrapper to handle async actions with loading state
    const withLoading = async (action) => {
      MainStore.setIsLoading(true);
      try {
        await action();
      } catch (error) {
        console.error('Error during action:', error);
      } finally {
        MainStore.setIsLoading(false);
      }
    };

    const getPlanLabel = () => {
      const plan = MainStore.currentPlan?.plan ?? "Select Plan";
    
      const words = plan.trim().split(/\s+/);
      if (words.length > 15) {
        return words.slice(0, 15).join(' ') + '…';
      }
      return plan;
    };

    const handleAnalyze = () =>{
      MainStore.setIsOpen(true)
    }


    return(
      <>
      {/* Loader overlay */}
      {MainStore.isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 pointer-events-none">
          <div className="w-12 h-12 border-4 border-t-4 border-white rounded-full animate-spin" />
        </div>
      )}

      {/* Floater component for marker information */}
      <Floater />

      {/* Title Bubble */}
      <div className="absolute top-4 left-0 w-full px-4 z-10 pointer-events-none">
        <div className="relative w-full max-w-lg mx-auto flex items-center">
          <div
            className="flex-1 px-6 py-3 text-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-extrabold text-md shadow-md"
          >
            {t("Resource Mapping")}
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
                MainStore.setIsGPSClick(!MainStore.isGPSClick)}
              }
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

            </div>
          </div>
        </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-13 left-0 w-full px-4 z-10 pointer-events-auto">
        {MainStore.currentStep === 0 && !MainStore.isFeatureClicked && (
          <div className="flex gap-4 w-full">
            <button
              className="flex-1 px-4 py-3 rounded-xl shadow-sm text-sm"
              onClick={() => {
                withLoading(toggleFormsUrl)
              }}
              disabled={!MainStore.isMarkerPlaced}
              style={{
                backgroundColor: !MainStore.isMarkerPlaced ? '#696969' : '#D6D5C9',
                color: !MainStore.isMarkerPlaced ? '#A8A8A8' : '#592941',
                border: 'none',
              }}
            >
              {t("Add Settlement")}
            </button>
          </div>
        )}

        {MainStore.currentStep === 0 && MainStore.isMarkerPlaced && MainStore.isFeatureClicked && (
          <div className="flex gap-4 w-full">
            <button
              className="flex-1 px-4 py-3 rounded-xl shadow-sm text-sm"
              onClick={() => withLoading(() =>{
                MainStore.setCurrentStep(1)
                MainStore.setIsResource(false)
              })}
              style={{ backgroundColor: '#D6D5C9', color: '#592941', border: 'none' }}
            >
              {t("Mark Resources")}
            </button>
            <button
              className="flex-1 px-4 py-3 rounded-xl shadow-sm text-sm"
              style={{ backgroundColor: '#D6D5C9', color: '#592941', border: 'none' }}
              onClick={handleAnalyze}
            >
              {t("Settlement Info")}
            </button>
          </div>
        )}

        {MainStore.currentStep === 1 && (
          <div className="flex gap-4 w-full">
            <button
              className="flex-1 px-4 py-3 rounded-xl shadow-sm text-sm"
              onClick={() => withLoading(toggleFormsUrl)}
              disabled={!MainStore.isFeatureClicked && !MainStore.isMarkerPlaced}
              style={{
                backgroundColor: !MainStore.isFeatureClicked && MainStore.isMarkerPlaced ? '#D6D5C9' : '#696969',
                color: '#592941',
                border: 'none',
              }}
            >
              {t("Add Well")}
            </button>
            <button
              className="flex-1 px-4 py-3 rounded-xl shadow-sm text-sm"
              onClick={() => withLoading(() => MainStore.setCurrentStep(2))}
              style={{ backgroundColor: '#D6D5C9', color: '#592941', border: 'none' }}
            >
              {t("Next") + "->"}
            </button>
          </div>
        )}

        {MainStore.currentStep === 2 && (
          <div className="flex gap-4 w-full">
            <button
              className="flex-1 px-4 py-3 rounded-xl shadow-sm text-sm"
              onClick={() => withLoading(toggleFormsUrl)}
              disabled={!MainStore.isFeatureClicked && !MainStore.isMarkerPlaced}
              style={{
                backgroundColor: !MainStore.isFeatureClicked && MainStore.isMarkerPlaced ? '#D6D5C9' : '#696969',
                color: '#592941',
                border: 'none',
              }}
            >
              {t("Add WaterStructure")}
            </button>
            <button
              className="flex-1 px-4 py-3 rounded-xl shadow-sm text-sm"
              onClick={() => withLoading(() => MainStore.setCurrentStep(3))}
              style={{ backgroundColor: '#D6D5C9', color: '#592941', border: 'none' }}
            >
              {t("Next") + "->"}
            </button>
          </div>
        )}

        {MainStore.currentStep === 3 && (
          <div className="flex gap-4 w-full">
            <button
              className="flex-1 px-4 py-3 rounded-xl shadow-sm text-sm"
              onClick={() => withLoading(toggleFormsUrl)}
              disabled={MainStore.isFeatureClicked && !MainStore.isMarkerPlaced}
              style={{
                backgroundColor: !MainStore.isFeatureClicked ? '#696969' : '#D6D5C9',
                color: '#592941',
                border: 'none',
              }}
            >
              {t("Provide Crop Info")}
            </button>
            <button
              className="flex-1 px-4 py-3 rounded-xl shadow-sm text-sm"
              onClick={() => withLoading(() => navigate('/'))}
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

export default ResourceMapping;