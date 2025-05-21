import { BottomSheet } from 'react-spring-bottom-sheet'
import 'react-spring-bottom-sheet/dist/style.css'
import useMainStore from "../store/MainStore.jsx";
import useLayersStore from '../store/LayerStore.jsx';

import nregaDetails from "../assets/nregaMapping.json"
import resourceDetails from "../assets/resource_mapping.json"
import SurfaceWaterBodies from './analyze/SurfaceWaterbodyAnalyze.jsx';
import GroundwaterAnalyze from './analyze/GroundwaterAnalyze.jsx';
import AgricultureAnalyze from './analyze/AgricultureAnalyze.jsx';
import { useState } from 'react';

const Bottomsheet = () => {

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
            {/* Title with bottom border and shadow */}
            <div className="text-center pt-8 text-xl font-bold text-gray-800 border-b border-gray-300 shadow-md pb-2 mb-6">
            NREGA Layer
            </div>

            <div className="mt-6">
            {/* Subtitle (left-aligned) */}
            <div className="text-left text-md font-medium text-gray-600 mb-4 pl-3">
                NREGA Work Categories
            </div>

            {/* Buttons (left-aligned) */}
            <div className="flex flex-wrap justify-start gap-2 pl-2">
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
                    className="text-black py-2 px-4 rounded-full border border-gray-300 shadow-sm hover:shadow-md transition-shadow"
                    onClick={() => handleWorkdAdd(item)}
                    >
                    {nregaDetails.properWorkNames[idx]}
                    </button>
                );
                })}
            </div>

            {/* === New Section: NREGA Work Years === */}
            <div className="mt-8">
                {/* Subtitle for years */}
                <div className="text-left text-md font-medium text-gray-600 mb-4 pl-3">
                NREGA Work Years
                </div>

                {/* Toggle switches (left-aligned) */}
                <div className="flex flex-wrap justify-start gap-4 pl-4">
                {MainStore.allNregaYears.map((year, idx) => {
                    const isChecked = MainStore.selectNregaYears.includes(year);
                    return (
                    <label key={idx} className="inline-flex items-center space-x-2">
                        <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleYearAdd(year)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{year}</span>
                    </label>
                    );
                })}
                </div>
            </div>
            </div>
        </>
    )

    const metaDataBody = (
        <>
            <div className="sticky top-0 z-20 bg-white text-center pt-8 text-xl font-bold text-gray-800 border-b border-gray-300 shadow-md pb-2 mb-6">
            Asset Info
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
            Asset Info
        </div>

        <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg ring-1 ring-gray-200">
            <table className="w-full table-auto border-separate border-spacing-y-3">
            <tbody>
                {MainStore.isResource && MainStore.selectedResource !== null &&
                /* ↓ flatMap lets us return 1 … N rows for each top‑level key */
                Object.keys(resourceDetails[MainStore.resourceType]).flatMap(
                    (key) => {
                    const rawValue = MainStore.selectedResource[key];

                    /* ---------- 1.  If the value is a nested object ---------- */
                    if (
                        rawValue &&
                        typeof rawValue === "object" &&
                        !Array.isArray(rawValue)
                    ) {
                        return Object.entries(rawValue).map(([subKey, subVal]) => {
                        /* friendly label: use mapping if available, else prettify */
                        const label =
                            resourceDetails[MainStore.resourceType][subKey] ??
                            subKey
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase());

                        return (
                            <tr
                            key={`${key}-${subKey}`}
                            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                            >
                            <td className="px-6 py-4 font-bold text-gray-900 break-words text-md">
                                {label}
                            </td>
                            <td className="px-6 py-4 text-gray-600 break-words text-md">
                                {subVal ?? "—"}
                            </td>
                            </tr>
                        );
                        });
                    }

                    /* ---------- 2.  Plain scalar value ---------- */
                    return (
                        <tr
                        key={key}
                        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        >
                        <td className="px-6 py-4 font-bold text-gray-900 break-words text-md">
                            {resourceDetails[MainStore.resourceType][key]}
                        </td>
                        <td className="px-6 py-4 text-gray-600 break-words text-md">
                            {rawValue ?? "—"}
                        </td>
                        </tr>
                    );
                    }
                )}
            </tbody>
            </table>
        </div>
        </>

    )

    const LayerStoreBody = (
        <>
        <div className="sticky top-0 z-20 bg-white text-center text-xl font-bold text-gray-800 border-b border-gray-300 shadow-md pb-2 mb-4">
            Layers Store
        </div>
        {MainStore.currentScreen === 'Groundwater' && <div className="flex flex-wrap gap-3">
            {LayerStoreKeysGW.map((key) => (
            <button
                key={key}
                onClick={() => {
                    LayerStore[layerStoreFuncMapping[key]](!LayerStore[key])
                    MainStore.setLayerClicked(key)
                    console.log("IN BOTTOM SHEET")
                }}
                className={`px-4 py-2 rounded-md shadow-sm text-sm transition-colors focus:outline-none
                ${LayerStore[key]
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }
                `}
            >
                {layerStoreNameMapping[key]}
            </button>
            ))}
        </div>}

        {MainStore.currentScreen === 'Agriculture' && <div className="flex flex-wrap gap-3">
            {LayerStoreKeysAgri.map((key) => (
            <button
                key={key}
                onClick={() => {
                    LayerStore[layerStoreFuncMapping[key]](!LayerStore[key])
                    MainStore.setLayerClicked(key)
                    console.log("IN BOTTOM SHEET")
                }}
                className={`px-4 py-2 rounded-md shadow-sm text-sm transition-colors focus:outline-none
                ${LayerStore[key]
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }
                `}
            >
                {layerStoreNameMapping[key]}
            </button>
            ))}
        </div>}

        </>
    )

    const onDismiss = () => {

        MainStore.setIsForm(false)

        MainStore.setNregaSheet(false)

        MainStore.setIsMetadata(false)
        MainStore.setMetadata(null)

        MainStore.setIsResource(true)
        //MainStore.setSelectedResource(null)

        MainStore.setIsWaterBody(false)


        MainStore.setIsGroundWater(false)


        MainStore.setIsAgriculture(false)
        MainStore.setSelectedMwsDrought(null)
        MainStore.setSelectedResource(null)

        MainStore.setIsLayerStore(false)

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
        open={MainStore.isOpen}
        onDismiss={onDismiss}
        snapPoints={({ maxHeight }) =>
          MainStore.isLayerStore ? [maxHeight / 2] : [maxHeight]
            }
        >
            <button
            onClick={onDismiss}
            className="
                absolute right-3 top-3 z-10
                w-8 h-8 flex items-center justify-center
                rounded-full bg-gray-200 hover:bg-gray-300
                text-gray-600 hover:text-gray-800
                shadow-sm transition
            "
            aria-label="Close"
            >
            &times;
            </button>
            <div className="pt-6">
            {renderBody()}
            </div>
        </BottomSheet>
    )
}

export default Bottomsheet