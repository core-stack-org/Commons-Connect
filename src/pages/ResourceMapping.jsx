import { useEffect } from "react";
import useMainStore from "../store/MainStore.jsx";
import { useNavigate } from "react-router-dom";
import getOdkUrlForScreen from "../action/getOdkUrl.js";

const ResourceMapping = () => {

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
      if(MainStore.markerCoords){
        MainStore.setIsForm(true)
        MainStore.setFormUrl(getOdkUrlForScreen(MainStore.currentScreen, MainStore.currentStep, MainStore.markerCoords, "", "", MainStore.blockName, MainStore.currentPlan.plan_id, MainStore.currentPlan.plan, ""))
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


    return(
      <>
      {/* Loader overlay */}
      {MainStore.isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 pointer-events-none">
          <div className="w-12 h-12 border-4 border-t-4 border-white rounded-full animate-spin" />
        </div>
      )}

      {/* Title Bubble */}
      <div className="absolute top-4 left-0 w-full px-4 z-10 pointer-events-none">
        <div className="relative w-full max-w-lg mx-auto flex items-center">
          <div
            className="flex-1 px-6 py-3 text-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-extrabold text-md shadow-md"
          >
            Resource Mapping
          </div>
        </div>
      </div>

      {/* 2. Top-left buttons */}
        <div className="absolute top-20 left-0 w-full px-4 z-10 flex justify-start pointer-events-auto">
          <div className="flex gap-4 max-w-lg">
            <div className="flex flex-col gap-3">
                {/* GPS Button */}
                <button
                className="flex-shrink-0 w-10 h-10 rounded-md shadow-sm flex items-center justify-center"
                style={{
                    backgroundColor: '#D6D5C9',
                    color: '#592941',
                    border: 'none',
                    backdropFilter: 'none',
                }}
                onClick={() => {}}
                >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                    />
                </svg>
                </button>

                <button
                  className="w-10 h-10 rounded-md shadow-sm flex items-center justify-center"
                  style={{ backgroundColor: '#D6D5C9', color: '#592941', border: 'none' }}
                  onClick={() => setIsInfoOpen(true)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8h.01M11 12h1v4h1m0 4a9 9 0 100-18 9 9 0 000 18z"
                    />
                  </svg>
                </button>
              </div>

            {/* Plan selector with dropdown */}
            <div className="relative">
            <button
                className="flex-1 px-2 py-2 rounded-md shadow-sm text-sm"
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
              className="flex-1 px-4 py-3 rounded-md shadow-sm text-sm"
              onClick={() => withLoading(toggleFormsUrl)}
              disabled={!MainStore.isMarkerPlaced}
              style={{
                backgroundColor: !MainStore.isMarkerPlaced ? '#696969' : '#D6D5C9',
                color: !MainStore.isMarkerPlaced ? '#A8A8A8' : '#592941',
                border: 'none',
              }}
            >
              Add Settlement
            </button>
          </div>
        )}

        {MainStore.currentStep === 0 && MainStore.isMarkerPlaced && MainStore.isFeatureClicked && (
          <div className="flex gap-4 w-full">
            <button
              className="flex-1 px-4 py-3 rounded-md shadow-sm text-sm"
              onClick={() => withLoading(() =>{
                MainStore.setCurrentStep(1)
                MainStore.setIsResource(false)
              })}
              style={{ backgroundColor: '#D6D5C9', color: '#592941', border: 'none' }}
            >
              Mark Resources
            </button>
            <button
              className="flex-1 px-4 py-3 rounded-md shadow-sm text-sm"
              style={{ backgroundColor: '#D6D5C9', color: '#592941', border: 'none' }}
            >
              Settlement Info
            </button>
          </div>
        )}

        {MainStore.currentStep === 1 && (
          <div className="flex gap-4 w-full">
            <button
              className="flex-1 px-4 py-3 rounded-md shadow-sm text-sm"
              onClick={() => withLoading(toggleFormsUrl)}
              disabled={MainStore.isFeatureClicked && MainStore.isMarkerPlaced}
              style={{
                backgroundColor: MainStore.isFeatureClicked ? '#696969' : '#D6D5C9',
                color: '#592941',
                border: 'none',
              }}
            >
              Add Well
            </button>
            <button
              className="flex-1 px-4 py-3 rounded-md shadow-sm text-sm"
              onClick={() => withLoading(() => MainStore.setCurrentStep(2))}
              style={{ backgroundColor: '#D6D5C9', color: '#592941', border: 'none' }}
            >
              {"Next ->"}
            </button>
          </div>
        )}

        {MainStore.currentStep === 2 && (
          <div className="flex gap-4 w-full">
            <button
              className="flex-1 px-4 py-3 rounded-md shadow-sm text-sm"
              onClick={() => withLoading(toggleFormsUrl)}
              disabled={MainStore.isFeatureClicked && MainStore.isMarkerPlaced}
              style={{
                backgroundColor: MainStore.isFeatureClicked ? '#696969' : '#D6D5C9',
                color: '#592941',
                border: 'none',
              }}
            >
              Add WaterStructure
            </button>
            <button
              className="flex-1 px-4 py-3 rounded-md shadow-sm text-sm"
              onClick={() => withLoading(() => MainStore.setCurrentStep(3))}
              style={{ backgroundColor: '#D6D5C9', color: '#592941', border: 'none' }}
            >
              {"Next ->"}
            </button>
          </div>
        )}

        {MainStore.currentStep === 3 && (
          <div className="flex gap-4 w-full">
            <button
              className="flex-1 px-4 py-3 rounded-md shadow-sm text-sm"
              onClick={() => withLoading(toggleFormsUrl)}
              disabled={MainStore.isFeatureClicked && MainStore.isMarkerPlaced}
              style={{
                backgroundColor: MainStore.isFeatureClicked ? '#696969' : '#D6D5C9',
                color: '#592941',
                border: 'none',
              }}
            >
              Provide Crop Info
            </button>
            <button
              className="flex-1 px-4 py-3 rounded-md shadow-sm text-sm"
              onClick={() => withLoading(() => navigate('/'))}
              style={{ backgroundColor: '#D6D5C9', color: '#592941', border: 'none' }}
            >
              Finish
            </button>
          </div>
        )}
      </div>
    </>
    )
}

export default ResourceMapping;