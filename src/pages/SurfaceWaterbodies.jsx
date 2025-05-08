import useMainStore from "../store/MainStore.jsx";
import getOdkUrlForScreen from "../action/getOdkUrl.js";

const SurfaceWaterBodies = () => {

    const MainStore = useMainStore((state) => state);
    
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


    return(
        <>{/* Title Bubble */}
            <div className="absolute top-4 left-0 w-full px-4 z-10 pointer-events-none">
                <div className="relative w-full max-w-lg mx-auto flex items-center">
                    <div className="flex-1 px-6 py-3 text-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-extrabold text-md shadow-md">
                        Surface WaterBodies
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
                            Analyze
                        </button>
                        <button
                            className="flex-1 px-4 py-3 rounded-md shadow-sm text-sm"
                            onClick={toggleFormsUrl}
                            disabled={!MainStore.isMarkerPlaced}
                            style={{ backgroundColor: '#D6D5C9', color: '#592941', border: 'none' }}
                        >
                            Provide Maintainence
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}

export default SurfaceWaterBodies;