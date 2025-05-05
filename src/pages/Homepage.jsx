import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import useMainStore from "../store/MainStore.jsx";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';

const Homepage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const MainStore = useMainStore((state) => state);
    const [isPlanOpen, setIsPlanOpen] = useState(false);
    const [isPlanningOpen, setIsPlanningOpen] = useState(false);
    const planRef = useRef(null);

    useEffect(() => {
      if(MainStore.blockName === null){
        MainStore.setDistrictName(searchParams.get('district'));
        MainStore.setBlockName(searchParams.get('block'));
        MainStore.setBlockId?.(searchParams.get('block_id'));
        MainStore.fetchPlans(`${import.meta.env.VITE_API_URL}get_plans/?block_id=${searchParams.get('block_id')}`)
      }
      MainStore.setCurrentScreen("HomeScreen")
    }, []);

    const getPlanLabel = () => {
      const plan = MainStore.currentPlan?.plan ?? "Select Plan";
    
      const words = plan.trim().split(/\s+/);
      if (words.length > 15) {
        return words.slice(0, 15).join(' ') + '…';
      }
      return plan;
    };

    const handleNregaSheet = () => {
      MainStore.setNregaSheet(true)
      MainStore.setIsOpen(true)
    }

    const handleSelect = (section) => {
      setIsPlanningOpen(false);
      // TODO: add navigation / state logic for each section
      console.log('Selected:', section);
    };

    return (
        <div>
        {/* 1. Header + hamburger wrapper */}
        <div
          className="absolute top-4 left-0 w-full px-4 z-10 pointer-events-none"
        >
          <div className="relative w-full max-w-lg mx-auto flex items-center">
            {/* Hamburger button: re-enable pointer events just for this */}
            <button
              className="pointer-events-auto p-2"
              onClick={() => console.log("Clicked")}
            >
              {/* simple SVG “hamburger” icon */}
              <svg
                className="h-10 w-10 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
      
            {/* Title bubble (still purely decorative) */}
            <div
              className="flex-1 px-6 py-3 text-center rounded-full
                         bg-white/10 backdrop-blur-sm border border-white/20
                         text-white font-extrabold text-md shadow-md"
            >
              {MainStore.blockName
                ? MainStore.blockName.charAt(0).toUpperCase() + MainStore.blockName.slice(1)
                : "Homepage"}
            </div>
          </div>
        </div>
      
        {/* 2. Top-left buttons */}
        <div className="absolute top-20 left-0 w-full px-4 z-10 flex justify-start pointer-events-auto">
        <div className="flex gap-4 max-w-lg items-center">
            {/* GPS Button */}
            <button
            className="flex-shrink-0 w-10 h-10 rounded-md shadow-sm flex items-center justify-center"
            style={{
                backgroundColor: '#D6D5C9',
                color: '#592941',
                border: 'none',
                backdropFilter: 'none',
            }}
            onClick={() => {
                /* your GPS-centering logic here */
            }}
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

            {/* Plan selector with dropdown */}
            <div className="relative" ref={planRef}>
            <button
                onClick={() => setIsPlanOpen(prev => !prev)}
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


                {isPlanOpen && (
                <div
                    className="absolute mt-2 left-0 w-40 bg-white rounded-md shadow-lg
                            overflow-y-auto max-h-48"
                >
                    {/* Replace this static list with your dynamic plans array if you have one */}
                    {MainStore.plans !== null && MainStore.plans.map(plan => (
                    <button
                        key={plan.plan_id}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                        onClick={() => {
                        /* handle selection */
                        setIsPlanOpen(false);
                        MainStore.setCurrentPlan(plan)
                        }}
                    >
                        {plan.plan}
                    </button>
                    ))}
                </div>
                )}

            </div>
            <button
              className="flex-1 px-2 py-2 rounded-md shadow-sm text-sm"
              style={{
                  backgroundColor: '#D6D5C9',
                  color: '#592941',
                  border: 'none',
                  backdropFilter: 'none',
              }}
              onClick={handleNregaSheet}
            >
            NREGA Works
            </button>
        </div>
        </div>

      
        {/* 3. Bottom buttons */}
        <div className="absolute bottom-13 left-0 w-full px-4 z-10 pointer-events-auto">
          <div className="flex gap-4 w-full">

            {/* RESOURCE MAPPING */}
            <button
              className={optStyle}
              onClick={() => {
                if (MainStore.currentPlan) {
                  MainStore.setCurrentStep(1);
                  MainStore.setCurrentScreen('Resource_mapping');
                  navigate('/resourcemapping');
                } else {
                  toast.error('Please Select a Plan !');
                }
              }}
            >
              Resource Mapping
            </button>

            {/* PLANNING & MENU */}
            <div className="relative flex-1">
              <button className={optStyle} onClick={() => setIsPlanningOpen((o) => !o)}>
                Planning
              </button>

              {isPlanningOpen && (
                <div
                  className="
                    absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-60 space-y-2
                    bg-white/20 backdrop-blur-lg border border-white/30 shadow-lg
                    rounded-xl p-2
                  "
                >
                  {['Groundwater', 'Surface Waterbodies', 'Agriculture', 'Livelihood'].map(
                    (item) => (
                      <button
                        key={item}
                        className={optStyle}
                        onClick={() => handleSelect(item)}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      

    );
};

export default Homepage;
