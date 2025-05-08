import { create } from "zustand";

const useMainStore = create((set) => ({
    
    //? Location Store
    districtName : null,
    blockName : null,
    block_id : null,

    setDistrictName : (name) => set({districtName : name}),
    setBlockName : (name) => set({blockName : name}),
    setBlockId : (id) => set({block_id : id}),


    //? Plans Store
    currentPlan : null,
    plans : null,

    fetchPlans : async(url) => {
        try{
            let response = await fetch(url, {
                    method: "GET",
                    headers: {
                        "ngrok-skip-browser-warning": "1",
                        "Content-Type": "application/json",
                    }
                }
            )
            response = await response.json()

            //console.log(response)
            set({plans : response.plans})
        }
        catch(e){
            console.log("Not able to Fetch Plans !")
        }
    },
    setCurrentPlan : (id) => set((state) => ({currentPlan : id})),


    //? Layers Hooks
    currentScreen : "HomeScreen",
    currentStep : 0,
    isFeatureClicked : false,
    isMarkerPlaced : false,
    markerCoords : null,
    selectedResource : null,
    fortnightData : null,
    lulcYearIdx : 0,
    isWaterbody : false,
    isGroundWater : false,

    setMarkerPlaced : (stat) => set({isMarkerPlaced : stat}),
    setFeatureStat : (stat) => set({isFeatureClicked : stat}),
    setCurrentScreen : (screen) => set({currentScreen : screen}),
    setCurrentStep : (step) => set({currentStep : step}),
    setFortnightData : (stat) => set({fortnightData : stat}),
    setSelectedResource : (stat) => set({selectedResource : stat}),
    setMarkerCoords : (stat) => set({markerCoords : stat}),
    setLulcYearIdx : (stat) => set({lulcYearIdx : stat}),
    setIsWaterBody : (stat) => set({isWaterbody : stat}),
    setIsGroundWater : (stat) => set({isGroundWater : stat}),

    //? NREGA Hooks
    isNregaSheet : false,
    allNregaYears : [],
    selectNregaYears : [2018],
    nregaWorks : [4],
    nregaStyle : {
        filter: ['in', ['get', 'workYear'], [2018]],
        'shape-points': 12,
        'shape-radius': 8,
        'shape-fill-color': [
          'match',
          ['get', 'itemColor'],
          4,
          '#6495ED',
          '#00000000'
        ],
    },

    setNregaSheet : (stat) => set({isNregaSheet : stat}),
    setAllNregaYears : (years) => set({allNregaYears : years}),
    setNregaYears : (years) => set({selectNregaYears : years}),
    setNregaWorks : (works) => set({nregaWorks : works}),
    setNregaStyle : (style) => set({nregaStyle : style}),

    
    //? Bottomsheet Hooks
    isOpen : false,
    isForm : false,
    isMetadata : false,
    metadata : null,
    formUrl : "",
    isLoading : false,
    isSubmissionSuccess : false,
    isResource : false,
    resourceType : null,
    isAnalyze : false,

    setIsOpen : (stat) => set({isOpen : stat}),
    setIsForm : (stat) => set({isForm : stat}),
    setIsMetadata: (stat) => set({isMetadata : stat}),
    setIsResource: (stat) => set({isResource : stat}),
    setResourceType: (stat) => set({resourceType : stat}),
    setMetadata: (stat) => set({metadata : stat}),
    setFormUrl : (stat) => set({formUrl : stat}),
    setIsLoading : (stat) => set({isLoading : stat}),
    setIsSubmissionSuccess : (stat) => set({isSubmissionSuccess : stat}),
    setIsAnalyze : (stat) => set({isAnalyze : stat}),

}))

export default useMainStore;