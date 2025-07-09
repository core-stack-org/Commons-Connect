import { BottomSheet } from 'react-spring-bottom-sheet'
import 'react-spring-bottom-sheet/dist/style.css'
import useMainStore from "../store/MainStore.jsx";
import useLayersStore from '../store/LayerStore.jsx';

import nregaDetails from "../assets/nregaMapping.json"
import resourceDetails from "../assets/resource_mapping.json"
import SurfaceWaterBodies from './analyze/SurfaceWaterbodyAnalyze.jsx';
import GroundwaterAnalyze from './analyze/GroundwaterAnalyze.jsx';
import AgricultureAnalyze from './analyze/AgricultureAnalyze.jsx';
import { useTranslation } from "react-i18next";


const Bottomsheet = () => {

    const { t } = useTranslation();
    const MainStore = useMainStore((state) => state);
    const LayerStore = useLayersStore((state) => state)
    let flg = false

    const LayerNameMapping = {
        0 : "settlement_layer",
        1 : "well_layer",
        2 : "waterbody_layer",
        3 : "cropgrid_layer"
    }
    
    const ResourceMapping = {
        0 : "settlement",
        1 : "well",
        2 : "waterbody",
        3 : "cropgrid"
    }

    const PlanningResource = {
        "Agriculture" : "plan_agri",
        "Groundwater" : "plan_gw",
        "Livelihood" : "livelihood"
    }

    const LayerStoreKeysGW = [
        "AdminBoundary", "NregaLayer", "WellDepth", "DrainageLayer",
        "SettlementLayer", 
        "WellLayer", "WaterStructure",
        "WorkGroundwater", "CLARTLayer"
    ]

    const LayerStoreKeysAgri = [
        "AdminBoundary", "NregaLayer", "DrainageLayer",
        "SettlementLayer", 
        "WellLayer", "WaterStructure",
        "WorkAgri", "CLARTLayer", "LULCLayer"
    ]
    
    const ResourceMetaKeys = {
        "Bail" : "Livestock Census : Ox (बैल)",
        "Cattle" : "Livestock Census : Cattle",
        "Goats" : "Livestock Census : Goats",
        "Piggery" : "Livestock Census : Piggery",
        "Poultry" : "Livestock Census : Poultry",
        "Sheep" : "Livestock Census : Sheep",
        "big_farmers" : "Farmer Census : Big Farmers",
        "landless_farmers" : "Farmer Census : Landless Farmers",
        "marginal_farmers" : "Farmer Census : Marginal Farmers",
        "medium_farmers" : "Farmer Census : Medium Farmers",
        "small_farmers" : "Farmer Census : Small Farmers",
        "select_one_Functional_Non_functional" : "Functional or not ?",
        "select_one_well_used" : "Used for Irrigation or Drinking ?",
        "select_one_well_used_other" : "Other usage",
        "select_one_change_water_quality" : "Water Quality",
        "select_one_maintenance" : "Requires Maintainence", 
        "select_one_repairs_well" : "Type of Repair (if Maintainence required)",
        "select_one_repairs_well_other" : "Other type of Repair"
    }

    const layerStoreNameMapping = {
        "AdminBoundary" : "Admin Boundary",
        "NregaLayer" : "NREGA Layer",
        "WellDepth" : "Well Depth",
        "DrainageLayer" : "Drainage Layer",
        "SettlementLayer" : "Settlement Layer",
        "WellLayer" : "Well Layer",
        "WaterStructure" : "Water Structures",
        "WorkAgri" : "Irrigation Structures",
        "WorkGroundwater" : "Recharge Structures",
        "Livelihood" : "Livelihood",
        "CLARTLayer" : "CLART Layer",
        "LULCLayer" : "LULC Layer"
    }

    const layerStoreFuncMapping = {
        "AdminBoundary" : "setAdminBoundary",
        "NregaLayer" : "setNregaLayer",
        "WellDepth" : "setWellDepth",
        "DrainageLayer" : "setDrainageLayer",
        "SettlementLayer" : "setSettlementLayer",
        "WellLayer" : "setWellLayer",
        "WaterStructure" : "setWaterStructure",
        "WorkAgri" : "setWorkAgri",
        "WorkGroundwater" : "setWorkGroundwater",
        "Livelihood" : "setLivelihood",
        "CLARTLayer" : "setCLARTLayer",
        "LULCLayer" : "setLULCLayer"
    }

    const handleOnLoadEvent = async() => {
        if(flg){
            if (MainStore.currentScreen === "Resource_mapping"){
                try{
                    MainStore.setIsLoading(true)
                    const payload = {
                        layer_name: LayerNameMapping[MainStore.currentStep],
                        resource_type: ResourceMapping[MainStore.currentStep],
                        plan_id: MainStore.currentPlan.plan_id,
                        plan_name: MainStore.currentPlan.plan,
                        district_name: MainStore.districtName,
                        block_name: MainStore.blockName,
                    }

                    const response = await fetch(`${import.meta.env.VITE_API_URL}add_resources/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    })

                    const res = await response.json()

                    MainStore.setIsLoading(false)

                    if (res.message === "Success") {
                        MainStore.setIsSubmissionSuccess(true)
                    }
                    onDismiss()

                }catch(err){
                    console.log(err)
                }
            }
            else{
                try{
                    MainStore.setIsLoading(true)
                    const payload = {
                        layer_name: "planning_layer",
                        work_type: PlanningResource[MainStore.currentScreen],
                        plan_id: MainStore.currentPlan.plan_id,
                        plan_name: MainStore.currentPlan.plan,
                        district_name: MainStore.districtName,
                        block_name: MainStore.blockName,
                    }
                    console.log(payload)
                    const response = await fetch(`${import.meta.env.VITE_API_URL}add_works/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    })

                    const res = await response.json()

                    MainStore.setIsLoading(false)

                    console.log(res)

                    if (res.message === "Success") {
                        MainStore.setIsSubmissionSuccess(true)
                    }
                    onDismiss()
                }
                catch(err){
                    console.log(err)
                }
            }
            flg = false;
        }
        else{
            console.log("Came here!")
            flg = true
        }
    }

    const handleYearAdd = (tempYear) =>{
        let active_years = []

        if(MainStore.selectNregaYears.includes(tempYear)){
            active_years = MainStore.selectNregaYears.filter((year) => year != tempYear);
            MainStore.setNregaYears(active_years);
        }
        else{
            active_years = [...MainStore.selectNregaYears];
            active_years.push(tempYear);
            MainStore.setNregaYears(active_years);
        }

        console.log(active_years)

        let tempFilter = ['in', ['get', 'workYear'], active_years]

        console.log(tempFilter)

        let tempNregaStyle = {
            filter: tempFilter,
            'shape-points': MainStore.nregaStyle['shape-points'],
            'shape-radius': MainStore.nregaStyle['shape-radius'],
            'shape-fill-color': MainStore.nregaStyle['shape-fill-color']
        }
        
        MainStore.setNregaStyle(tempNregaStyle);
    }

    const handleWorkdAdd = (work) => {
        let checked = MainStore.nregaWorks.includes(nregaDetails.workToNumMapping[work])
        let tempWorks
        
        if(!checked){
            tempWorks = [...MainStore.nregaWorks]
            tempWorks.push(nregaDetails.workToNumMapping[work])
        }
        else{
            tempWorks = MainStore.nregaWorks.filter((y) => y != nregaDetails.workToNumMapping[work]);
        }

        MainStore.setNregaWorks(tempWorks)

        let styleFillColor = ['match', ['get', 'itemColor']]
        
        tempWorks.map((item, idx) => {
            styleFillColor.push(item);
            styleFillColor.push(nregaDetails.NumToColorMapping[item])
        })

        styleFillColor.push('#00000000')

        if (tempWorks.length === 0) {
            styleFillColor = '#00000000'
        }

        let tempNregaStyle =  {
            filter: MainStore.nregaStyle.filter,
            'shape-points': MainStore.nregaStyle['shape-points'],
            'shape-radius': MainStore.nregaStyle['shape-radius'],
            'shape-fill-color': styleFillColor
        }

        MainStore.setNregaStyle(tempNregaStyle);
    }

    const nregaBody = (
        <>
            {/* Enhanced Title with cleaner styling */}
            <div className="text-center pt-8 pb-6 mb-8 bg-gradient-to-r border-b border-gray-200">
                <h1 className="text-2xl font-semibold text-gray-800 tracking-wide">
                    {t("NREGA Assets")}
                </h1>
            </div>
    
            <div className="px-6 pb-8">
                {/* Enhanced Work Categories Section */}
                <div className="mb-8">
                    <div className="flex items-center mb-6">
                        <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
                        <h2 className="text-lg font-medium text-gray-700">
                            {t("NREGA Work Categories")}
                        </h2>
                    </div>
    
                    {/* Improved button grid layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {nregaDetails.works.map((item, idx) => {
                            const color = [
                                nregaDetails.buttonColorMapping[item],
                                nregaDetails.buttonColorMapping.Default
                            ];
                            const isSelected = MainStore.nregaWorks.includes(nregaDetails.workToNumMapping[item]);
                            return (
                                <button
                                    key={idx}
                                    style={{
                                        backgroundColor: isSelected
                                            ? `rgba(${color[0].join(",")})`
                                            : ""
                                    }}
                                    className={`
                                        flex items-center justify-between p-4 rounded-lg border transition-all duration-200
                                        ${isSelected 
                                            ? 'border-gray-400 shadow-md transform scale-[1.02]' 
                                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                        }
                                        bg-white text-gray-700 font-medium text-sm text-left
                                        focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300
                                    `}
                                    onClick={() => handleWorkdAdd(item)}
                                >
                                    <div className="flex items-center">
                                        {/* Color indicator dot */}
                                        <div 
                                            className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                                            style={{ backgroundColor: `rgba(${color[0].join(",")})` }}
                                        ></div>
                                        <span className="leading-tight">
                                            {t(nregaDetails.properWorkNames[idx])}
                                        </span>
                                    </div>
                                    
                                    {/* Selection indicator */}
                                    {isSelected && (
                                        <svg className="w-4 h-4 text-gray-600 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
    
                {/* Enhanced NREGA Work Years Section */}
                {/* <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center mb-6">
                        <div className="w-1 h-6 bg-green-500 rounded-full mr-3"></div>
                        <h2 className="text-lg font-medium text-gray-700">
                            NREGA Work Years
                        </h2>
                    </div>
    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {MainStore.allNregaYears.map((year, idx) => {
                            const isChecked = MainStore.selectNregaYears.includes(year);
                            return (
                                <label 
                                    key={idx} 
                                    className={`
                                        flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200
                                        ${isChecked 
                                            ? 'bg-blue-50 border-blue-200 shadow-sm' 
                                            : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleYearAdd(year)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mr-3"
                                    />
                                    <span className={`text-sm font-medium ${isChecked ? 'text-blue-700' : 'text-gray-700'}`}>
                                        {year}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div> */}

                {/* NREGA Works Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <p className="text-sm text-blue-800 text-left font-medium">
                        {t("nrega_works_info")}
                    </p>
                </div>
            </div>
        </>
    )

    const metaDataBody = (
        <>
            <div className="sticky top-0 z-20 bg-white text-center pt-8 text-xl font-bold text-gray-800 border-b border-gray-300 shadow-md pb-2 mb-6">
            {t("Asset Info")}
            </div>

            <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg ring-1 ring-gray-200">
                <table className="w-full table-auto border-separate border-spacing-y-3">
                    <tbody>
                    {MainStore.isMetadata && MainStore.metadata !== null && Object.keys(nregaDetails.NameDisplayMapping).map((key) => {
                        const rawValue = MainStore.metadata[key];
                        const formattedValue =
                        key === 'Material' || key === 'Total_Expe'
                            ? `₹${rawValue}`
                            : rawValue;

                        return (
                        <tr
                            key={key}
                            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        >
                            <td className="px-6 py-4 font-bold text-gray-900 break-words text-md">
                            {nregaDetails.NameDisplayMapping[key]}
                            </td>
                            <td className="px-6 py-4 text-gray-600 break-words text-md">
                            {formattedValue}
                            </td>
                        </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </>
    )

    const resourceBody = (
        <>
        <div className="sticky top-0 z-20 bg-white text-center pt-8 text-xl font-bold text-gray-800 border-b border-gray-300 shadow-md pb-2 mb-6">
            {t("Resource Info")}
        </div>

        <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg ring-1 ring-gray-200">
        <tbody>
            {MainStore.isResource && MainStore.selectedResource !== null &&
                Object.keys(resourceDetails[MainStore.resourceType]).flatMap(key => {
                let rawValue = MainStore.selectedResource[key];

                if (rawValue && (key === "Livestock_" || key === "farmer_fam" || key === "Well_condi")) {
                    const jsonReady = rawValue.replace(/'/g, '"').replace(/\bNone\b/g, 'null');
                    const data = (new Function(`return (${jsonReady})`))();

                    return Object.keys(data).map(innerKey => (
                    <tr
                        key={innerKey}
                        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                        {/* ⬇️ add grey background to the leftmost cell */}
                        <td className="px-6 py-4 font-bold text-gray-900 break-words text-md bg-gray-50 rounded-l-lg">
                        {ResourceMetaKeys[innerKey]}
                        </td>
                        <td className="px-6 py-4 text-gray-600 break-words text-md">
                        {data[innerKey] ?? "—"}
                        </td>
                    </tr>
                    ));
                }

                return (
                    <tr
                    key={key}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                    {/* ⬇️ same tweak here */}
                    <td className="px-6 py-4 font-bold text-gray-900 break-words text-md bg-gray-50 rounded-l-lg">
                        {resourceDetails[MainStore.resourceType][key]}
                    </td>
                    <td className="px-6 py-4 text-gray-600 break-words text-md">
                        {rawValue ?? "—"}
                    </td>
                    </tr>
                );
                })}
            </tbody>
        </div>
        </>

    )

    const LayerStoreBody = (
        <>
        <div className="sticky top-0 z-20 bg-white text-center text-xl font-bold text-gray-800 border-b border-gray-300 shadow-md pb-3 mb-5">
            <div className="text-xl font-bold text-gray-800">Layers Store</div>
            <div className="text-sm text-gray-600 font-normal mt-1">
                {MainStore.currentScreen === 'Groundwater' ? 'Groundwater Layers' : 'Agriculture Layers'}
            </div>
        </div>
        
        {MainStore.currentScreen === 'Groundwater' && <div className="grid grid-cols-2 gap-4 p-1">
            {LayerStoreKeysGW.map((key) => (
            <button
                key={key}
                onClick={() => {
                    LayerStore[layerStoreFuncMapping[key]](!LayerStore[key])
                    MainStore.setLayerClicked(key)
                }}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm hover:shadow-md
                ${LayerStore[key]
                    ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }
                `}
            >
                <div className="flex items-center justify-center space-x-2">
                    {LayerStore[key] && (
                        <span className="w-2 h-2 bg-white rounded-full flex-shrink-0"></span>
                    )}
                    <span className="text-center leading-tight">
                        {layerStoreNameMapping[key]}
                    </span>
                </div>
            </button>
            ))}
        </div>}
    
        {MainStore.currentScreen === 'Agriculture' && <div className="grid grid-cols-2 gap-4 p-1">
            {LayerStoreKeysAgri.map((key) => (
            <button
                key={key}
                onClick={() => {
                    LayerStore[layerStoreFuncMapping[key]](!LayerStore[key])
                    MainStore.setLayerClicked(key)
                    console.log("IN BOTTOM SHEET")
                }}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm hover:shadow-md
                ${LayerStore[key]
                    ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }
                `}
            >
                <div className="flex items-center justify-center space-x-2">
                    {LayerStore[key] && (
                        <span className="w-2 h-2 bg-white rounded-full flex-shrink-0"></span>
                    )}
                    <span className="text-center leading-tight">
                        {layerStoreNameMapping[key]}
                    </span>
                </div>
            </button>
            ))}
        </div>}
    
        </>
    )

    const onDismiss = () => {

        MainStore.setIsForm(false)

        MainStore.setNregaSheet(false)

        MainStore.setIsMetadata(false)

        MainStore.setIsResource(false)

        MainStore.setIsWaterBody(false)


        MainStore.setIsGroundWater(false)


        MainStore.setIsAgriculture(false)

        MainStore.setIsLayerStore(false)

        MainStore.setIsResourceOpen(false)
        MainStore.setIsOpen(false)
    }

    const renderBody = () => {
        switch (true) {
          case MainStore.isForm && MainStore.formUrl !== "":
            return (
              <iframe
                id="odk-frame"
                src={MainStore.formUrl}
                style={{ width: "100vw", height: "100vh" }}
                onLoad={handleOnLoadEvent}
              />
            );
    
          case MainStore.isNregaSheet:
            return nregaBody;
    
          case MainStore.isMetadata && MainStore.metadata !== null:
            return metaDataBody;
    
          case MainStore.isResource && MainStore.selectedResource !== null:
            return resourceBody;
    
          case MainStore.isWaterbody:
            return <SurfaceWaterBodies />;
    
          case MainStore.isGroundWater:
            return <GroundwaterAnalyze />;
    
          case MainStore.isAgriculture && MainStore.currentStep === 0:
            return <AgricultureAnalyze />;
            
          case MainStore.isLayerStore:
            return LayerStoreBody

          default:
            return null;
        }
    };
    

    return (
        <BottomSheet
        open={MainStore.isOpen || (MainStore.isResourceOpen && MainStore.currentScreen === "HomeScreen")}
        onDismiss={onDismiss}
        snapPoints={({ maxHeight }) =>
          MainStore.isLayerStore ? [maxHeight / 2] : [maxHeight]
            }
        >
            {/* Conditional header buttons based on content type */}
            {MainStore.isNregaSheet ? (
                <>
                    {/* Cancel button for NREGA sheet */}
                    <button
                    onClick={onDismiss}
                    className="
                        absolute left-3 top-3 z-10
                        px-4 py-2 rounded-lg
                        bg-gray-100 hover:bg-gray-200
                        text-gray-700 hover:text-gray-800
                        text-sm font-medium
                        shadow-sm transition
                        border border-gray-300
                    "
                    aria-label="Cancel"
                    >
                    Cancel
                    </button>
                    
                    {/* Done button for NREGA sheet */}
                    <button
                    onClick={onDismiss}
                    className="
                        absolute right-3 top-3 z-10
                        px-4 py-2 rounded-lg
                        bg-blue-600 hover:bg-blue-700
                        text-white
                        text-sm font-medium
                        shadow-sm transition
                    "
                    aria-label="Done"
                    >
                    Done
                    </button>
                </>
            ) : (
                /* Cancel button for other sheets */
                <button
                onClick={onDismiss}
                className="
                    absolute left-3 top-3 z-10
                    px-4 py-2 rounded-lg
                    bg-gray-100 hover:bg-gray-200
                    text-gray-700 hover:text-gray-800
                    text-sm font-medium
                    shadow-sm transition
                    border border-gray-300
                "
                aria-label="Cancel"
                >
                Cancel
                </button>
            )}
            <div className="pt-6">
            {renderBody()}
            </div>
        </BottomSheet>
    )
}

export default Bottomsheet