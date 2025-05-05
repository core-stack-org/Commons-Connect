import { BottomSheet } from 'react-spring-bottom-sheet'
import 'react-spring-bottom-sheet/dist/style.css'
import useMainStore from "../store/MainStore.jsx";
import { useEffect } from 'react';

import nregaDetails from "../assets/nregaMapping.json"

const Bottomsheet = () => {

    const MainStore = useMainStore((state) => state);
    let flg = false
    const LayerNameMapping = {
        1 : "settlement_layer",
        2 : "well_layer",
        3 : "waterbody_layer",
        4 : "cropgrid_layer"
    }
    const ResourceMapping = {
        1 : "settlement",
        2 : "well",
        3 : "waterbody",
        4 : "cropgrid"
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
                    console.log(payload)
                    const response = await fetch(`${import.meta.env.VITE_API_URL}add_resources/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    })

                    const res = await response.json()
                    console.log(res)

                    MainStore.setIsLoading(false)

                    if (res.message == "Success") {
                        MainStore.setIsSubmissionSuccess(true)
                    }
                    onDismiss()

                }catch(err){
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
                    {MainStore.metadata !== null && Object.keys(nregaDetails.NameDisplayMapping).map((key) => {
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

    const onDismiss = () => {
        if(MainStore.isForm){
            MainStore.setIsForm(false)
        }
        else if(MainStore.isNregaSheet){
            MainStore.setNregaSheet(false)
        }
        else if(MainStore.isMetadata){
            MainStore.setIsMetadata(false)
            MainStore.setMetadata(null)
        }
        MainStore.setIsOpen(false)
    }

    return (
            <BottomSheet
                open={MainStore.isOpen}
                onDismiss={onDismiss}
                snapPoints={({ maxHeight }) => [maxHeight]}
            >
                {MainStore.isForm && MainStore.formUrl !== "" && <iframe
                    id="odk-frame"
                    src={MainStore.formUrl}
                    style={{ width: "100vw", height: "100vh" }}
                    onLoad={() => handleOnLoadEvent()}
                ></iframe>}

                {MainStore.isNregaSheet && nregaBody}

                {MainStore.isMetadata && MainStore.metadata !== null && metaDataBody}

            </BottomSheet>
    )
}

export default Bottomsheet