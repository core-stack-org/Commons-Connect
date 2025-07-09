import useMainStore from "../store/MainStore.jsx";
import getOdkUrlForScreen from "../action/getOdkUrl.js";
import Floater from "../components/Floater.jsx";

const Livelihood = () => {

    const MainStore = useMainStore((state) => state);

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

    const toggleFormsUrl = () =>{

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
        if(MainStore.markerCoords){
          MainStore.setIsForm(true)
          
          MainStore.setFormUrl(getOdkUrlForScreen(MainStore.currentScreen, MainStore.currentStep, MainStore.markerCoords, MainStore.settlementName, "", MainStore.blockName, MainStore.currentPlan.plan_id, MainStore.currentPlan.plan, MainStore.selectedResource.id, false, gpsCoords))
          
          MainStore.setIsOpen(true)
        }
    }

    const handleAnalyze = () =>{
        MainStore.setIsOpen(true)
    }

    return(
        <>
            <div className="absolute top-4 left-0 w-full px-4 z-10 pointer-events-none">
                <div className="relative w-full max-w-lg mx-auto flex items-center">
                    <div className="flex-1 px-6 py-3 text-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-extrabold text-md shadow-md">
                        Livelihood
                    </div>
                </div>
            </div>

            {/* Floater component for marker information */}
            <Floater />

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
                        onClick={() => {MainStore.setIsGPSClick(true)}}
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
                            backgroundColor: '#808080',
                            color: '#592941',
                            border: '1px solid #D6D5C9',
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
                        className="flex-1 px-4 py-3 rounded-xl shadow-sm text-sm"
                        onClick={() => withLoading(() =>{
                            MainStore.setCurrentStep(1)
                        })}
                        disabled={!MainStore.isFeatureClicked}
                        style={{
                            backgroundColor: !MainStore.isFeatureClicked ? '#696969' : '#D6D5C9',
                            color: !MainStore.isFeatureClicked ? '#A8A8A8' : '#592941',
                            border: 'none',
                        }}
                    >
                    Select Settlement
                    </button>
                </div>
                )}

                {MainStore.currentStep === 1 && (
                <div className="flex gap-4 w-full">
                    <button
                        className="flex-1 px-4 py-3 rounded-xl shadow-sm text-sm"
                        onClick={toggleFormsUrl}
                        style={{ 
                            backgroundColor: MainStore.isFeatureClicked ? '#696969' : '#D6D5C9',
                            color: MainStore.isFeatureClicked ? '#A8A8A8' : '#592941',
                            border: 'none', 
                        }}
                        disabled={MainStore.isFeatureClicked}
                    >
                    Mark Livelihood
                    </button>
                    <button
                        className="flex-1 px-4 py-3 rounded-xl shadow-sm text-sm"
                        style={{ 
                            backgroundColor: !MainStore.isFeatureClicked ? '#696969' : '#D6D5C9',
                            color: !MainStore.isFeatureClicked ? '#A8A8A8' : '#592941',
                            border: 'none', 
                        }}
                        onClick={handleAnalyze}
                        disabled={!MainStore.isFeatureClicked}
                    >
                    Livelihood Info
                    </button>
                </div>
                )}
            </div>
        </>
    )
}

export default Livelihood;