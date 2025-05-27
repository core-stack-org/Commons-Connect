import useMainStore from "../store/MainStore.jsx";
import getOdkUrlForScreen from "../action/getOdkUrl.js";
import { useTranslation } from "react-i18next";

const SurfaceWaterBodies = () => {

    const MainStore = useMainStore((state) => state);
    const { t } = useTranslation();
    
    const handleAnalyze = () =>{
        MainStore.setIsOpen(true)
    }

    const toggleFormsUrl = () =>{
        if(MainStore.markerCoords){
          MainStore.setIsForm(true)
          MainStore.setFormUrl(getOdkUrlForScreen(MainStore.currentScreen, MainStore.currentStep, MainStore.markerCoords, "", "", MainStore.blockName, MainStore.currentPlan.plan_id, MainStore.currentPlan.plan, ""))
          MainStore.setIsOpen(true)
        }
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
        <>{/* Title Bubble */}
            <div className="absolute top-4 left-0 w-full px-4 z-10 pointer-events-none">
                <div className="relative w-full max-w-lg mx-auto flex items-center">
                    <div className="flex-1 px-6 py-3 text-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-extrabold text-md shadow-md">
                        {t("Surface WaterBodies")}
                    </div>
                </div>
            </div>

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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                    <path d="M50 20c-11 0-20 9-20 20 0 11 20 40 20 40s20-29 20-40c0-11-9-20-20-20z" 
                    fill="#592941" stroke="#592941" strokeWidth="1" />
                    <circle cx="50" cy="40" r="7" fill="white" />
                </svg>
                </button>

                <button
                    className="w-10 h-10 rounded-md shadow-sm flex items-center justify-center"
                    style={{ backgroundColor: '#D6D5C9', color: '#592941', border: 'none' }}
                    onClick={() => MainStore.setIsInfoOpen(true)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="30" fill="#592941" stroke="#592941" strokeWidth="2" />
                    <circle cx="50" cy="40" r="3.5" fill="white" />
                    <rect x="46.5" y="47" width="7" height="25" rx="2" fill="white" />
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
                {MainStore.currentStep === 0 && (
                    <div className="flex gap-4 w-full">
                        <button
                            className="flex-1 px-4 py-3 rounded-md shadow-sm text-sm"
                            onClick={() => handleAnalyze()}
                            disabled={!MainStore.isMarkerPlaced && MainStore.isWaterbody}
                            style={{
                                backgroundColor: !MainStore.isMarkerPlaced ? '#696969' : '#D6D5C9',
                                color: !MainStore.isMarkerPlaced ? '#A8A8A8' : '#592941',
                                border: 'none',
                            }}
                        >
                            {t("Analyze")}
                        </button>
                        <button
                            className="flex-1 px-4 py-3 rounded-md shadow-sm text-sm"
                            onClick={toggleFormsUrl}
                            disabled={!MainStore.isMarkerPlaced}
                            style={{ backgroundColor: '#D6D5C9', color: '#592941', border: 'none' }}
                        >
                            {t("Propose Maintainence")}
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}

export default SurfaceWaterBodies;