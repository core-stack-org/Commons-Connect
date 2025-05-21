import React, { useState } from 'react';
import useMainStore from '../store/MainStore';


const InfoBox = () => {
  const isInfoOpen = useMainStore((state) => state.isInfoOpen);
  const setIsInfoOpen = useMainStore((state) => state.setIsInfoOpen);
  const currentScreen = useMainStore((state) => state.currentScreen);
  const currentPlan = useMainStore((state) => state.currentPlan);
  const currentStep = useMainStore((state) => state.currentStep);
  const currentMenuOption = useMainStore((state) => state.menuOption);
  const setMenuOption = useMainStore((state) => state.setMenuOption);

  const isHome = currentScreen === 'HomeScreen';
  const [activeTab, setActiveTab] = useState('information');

  // Handlers for menu options
  const handleLanguageSelect = (lang) => {
    console.log('Language selected:', lang);
    setMenuOption(null);
    setIsInfoOpen(false);
  };

  const handleDownloadDPR = () => {
    console.log('Downloading DPR...');
    // implement download logic here
    setMenuOption(null);
    setIsInfoOpen(false)
  };

  const handleUploadKML = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Uploading KML:', file.name);
      // implement upload logic here
      setMenuOption(null);
      setIsInfoOpen(false)
    }
  };

  // Content for non-home screens
    const screenContent = {
      Resource_mapping: (
        <>
          <h2 className="text-lg font-bold mb-2">Resource Mapping</h2>
          <p className="text-gray-700 text-sm">
          This is a critical step to map out different settlements in the area, their socio-economic status, and which resources such as well and water bodies and crop-lands are they dependent on. Follow the tour to provide this information in a step-by-step manner.
          </p>
        </>
      ),
      Groundwater: (
          <>
            <p className="text-gray-700 text-sm">
                This screen helps user track groundwater changes over the past five years and find areas in need of groundwater recharge structures.
            </p>
            <h3 className="font-extrabold mt-1 mb-1 text-lg underline">Analyze</h3>
            <p>Under "Analyse" the user can see how the groundwater levels have gone up or down.</p>
    
            <h3 className="font-extrabold mt-1 mb-1 text-lg underline">Start Planning</h3>
            <p>Under "start planning" tab the user can start planning the recharge structure based on a color-coded CLART map showing recharge feasibility and user can also find out what kind of treatment is needed for High, Moderate and low groundwater recharge structures and also areas suitable for regeneration.</p>
    
            {currentStep === 1 ? (
                <>
                <h3 className="font-extrabold mt-1 mb-1 text-lg underline">CLART Legend</h3>
                <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                    <div className="w-6 h-6 rounded bg-gray-100 mr-3"></div>
                    <span>Empty</span>
                    </div>
                    <div className="flex items-center">
                    <div className="w-6 h-6 rounded bg-green-400 mr-3"></div>
                    <span>Good recharge</span>
                    </div>
                    <div className="flex items-center">
                    <div className="w-6 h-6 rounded bg-yellow-300 mr-3"></div>
                    <span>Moderate recharge</span>
                    </div>
                    <div className="flex items-center">
                    <div className="w-6 h-6 rounded bg-purple-700 mr-3"></div>
                    <span>Regeneration</span>
                    </div>
                    <div className="flex items-center">
                    <div className="w-6 h-6 rounded bg-blue-500 mr-3"></div>
                    <span>High runoff zone</span>
                    </div>
                    <div className="flex items-center">
                    <div className="w-6 h-6 rounded bg-red-600 mr-3"></div>
                    <span>Surface water harvesting</span>
                    </div>
                </div>
                </>
            ) : (
                <>
                <h3 className="font-extrabold mt-1 mb-1 text-lg underline">Well Depth Legend</h3>
                <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                    <div className="w-6 h-6 rounded bg-red-600 mr-3"></div>
                    <span>Less than -5m</span>
                    </div>
                    <div className="flex items-center">
                    <div className="w-6 h-6 rounded bg-yellow-300 mr-3"></div>
                    <span>{">-5m to -1m"}</span>
                    </div>
                    <div className="flex items-center">
                    <div className="w-6 h-6 rounded bg-green-500 mr-3"></div>
                    <span>{">-1m to 1m"}</span>
                    </div>
                    <div className="flex items-center">
                    <div className="w-6 h-6 rounded bg-blue-600 mr-3"></div>
                    <span>More than 1m</span>
                    </div>
                </div>
                </>
            )}
            </>
      ),
      SurfaceWater: (
        <>
          <p className="text-gray-700 text-sm">
              This screen helps user to understand the spread of surface water bodies such as rivers, lakes and reservoirs to understand variations in surface water bodies and based on the observations recorded analysis of water presence in the water bodies, the user can propose the need/demand for farm pond repair, check dam repair, canal repair and trench cum bunds to be repaired.
          </p>
          <h3 className="font-extrabold mt-1 mb-1 text-lg underline">Analyze</h3>
          <p>
          Please select 'Analyze' tab to see health indicator of water bodies in terms of their % area having water; The graph helps user to assess the availability of water in surface bodies and identify the most vulnerable areas where waterbody health may be deteriorating.
          </p>
          <h3 className="font-extrabold mt-1 mb-1 text-lg underline">Propose Maintenance</h3>
          <p>By selecting 'Propose Maintenance' tab user can select the type of maintenance on existing water body.</p>
        </>
      ),
      Agriculture: (
        <>
          <h2 className="text-lg font-semibold mb-2">Agriculture Info</h2>
          <p className="text-gray-700 text-sm">
            Crop information, soil health, and agricultural practices.
          </p>
        </>
      ),
      Livelihood: (
        <>
          <h2 className="text-lg font-semibold mb-2">Livelihood Info</h2>
          <p className="text-gray-700 text-sm">
            Livelihood programs, employment schemes, and community activities.
          </p>
        </>
      ),
    };
  

  if (!isInfoOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-white/10 backdrop-blur-md"
        onClick={() => setIsInfoOpen(false)}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 z-10 pointer-events-auto">
        {/* Header */}
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
          {currentMenuOption
            ? currentMenuOption === 'language'
              ? 'Choose Language'
              : currentMenuOption === 'download dpr'
              ? 'Download DPR'
              : 'Upload KML'
            : 'Information'}
        </h2>

        {/* Close */}
        <button
          className="absolute text-xl top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={() => {
            setIsInfoOpen(false);
            setMenuOption(null);
          }}
        >
          ✕
        </button>

        {/* Menu Option Content */}
        {currentMenuOption ? (
          <div className="text-center space-y-4">
            {currentMenuOption === 'language' && (
              <div className="space-y-2">
                {['en', 'hi', 'mr'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageSelect(lang)}
                    className="w-full py-2 border rounded-lg hover:bg-gray-100"
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            {currentMenuOption === 'download dpr' && (
              <button
                onClick={handleDownloadDPR}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Download DPR
              </button>
            )}

            {currentMenuOption === 'upload kml' && (
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".kml"
                  onChange={handleUploadKML}
                  className="w-full"
                />
              </div>
            )}
          </div>
          ) : isHome ? (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                className={`flex-1 text-center py-2 font-medium text-sm ${
                  activeTab === 'information'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('information')}
              >
                Information
              </button>
              <button
                className={`flex-1 text-center py-2 font-medium text-sm ${
                  activeTab === 'plan'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('plan')}
              >
                Plan Information
              </button>
            </div>

            {/* Home Content */}
            {activeTab === 'information' ? (
                <div className="overflow-y-auto max-h-[70vh]">
              <div className="text-gray-800 text-sm space-y-6">
                {/* Steps Section */}
                <div>
                  <h3 className="font-semibold mb-2">Steps</h3>
                  <ol className="space-y-3">
                    {[
                        "Select a plan.",
                        "Mark settlements and resource ownership and usage under the Resource Mapping tab.",
                        "To start planning natural resource management work, go to these tabs under Planning:"
                    ].map((item, index) => (
                        <li key={index} className="flex items-start">
                        <div className="bg-blue-500 text-white rounded-full min-w-6 w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0">
                            <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <span className="pt-0.5">{item}</span>
                        </li>
                    ))}
                    </ol>
                </div>
                {/* Screens Information Section */}
                <div>
                  <h3 className="font-bold underline mb-2">Groundwater</h3>
                  <p>
                    To understand the Groundwater stress at micro watershed level please select the 'Groundwater' tab.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold underline mb-2">Surface Waterbodies</h3>
                  <p>
                    To understand the health of surface bodies like ponds over years, please select the 'Surface Waterbodies' tab.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold underline mb-2">Agriculture</h3>
                  <p>
                    To understand the cropping patterns throughout the year please select the 'Agriculture' tab.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold underline mb-2">Livelihoods</h3>
                  <p>
                    To capture other Non-NRM work demands like livestock shelters, please select the 'Livelihood' tab.
                  </p>
                </div>
              </div>
              </div>
            ) : (
                <div className="overflow-y-auto max-h-[70vh]">
              <div className="text-gray-800 text-sm">
                {currentPlan === null ? (
                  <p className="font-semibold">Plan not selected</p>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="bg-white divide-y divide-gray-100">
                      {Object.entries(currentPlan).map(([key, value]) => {
                        const label = key
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (c) => c.toUpperCase());
                        return (
                          <tr key={key}>
                            <td className="px-4 py-2 text-sm font-medium text-gray-700 whitespace-nowrap">
                              {label}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-800">
                              {value}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-gray-800 text-sm">
            {screenContent[currentScreen] || (
              <p>No additional information available for this screen.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoBox;
