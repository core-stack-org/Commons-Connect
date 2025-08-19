import { create } from "zustand";

const useMainStore = create((set) => ({
    //? Default Store
    isInfoOpen : false,
    menuOption : null,

    setIsInfoOpen : (stat) => set({isInfoOpen : stat}),
    setMenuOption : (stat) => set({menuOption : stat}),

    //? Location Store
    districtName : null,
    blockName : null,
    block_id : null,
    isGPSClick : false,
    gpsLocation : null,
    layerClicked : null,
    
    //? NEW: Store homepage URL for navigation back
    homepageUrl : null,

    setDistrictName : (name) => set({districtName : name}),
    setBlockName : (name) => set({blockName : name}),
    setBlockId : (id) => set({block_id : id}),
    setHomepageUrl : (url) => set({homepageUrl : url}),
    setIsGPSClick : (stat) => set({isGPSClick : stat}),
    setGpsLocation : (stat) => set({gpsLocation : stat}),
    setLayerClicked : (stat) => set({layerClicked : stat}),

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
    settlementName : "",
    isFeatureClicked : false,
    isMarkerPlaced : false,
    markerCoords : null,
    selectedResource : null,
    fortnightData : null,
    lulcYearIdx : 0,
    isWaterbody : false,
    isGroundWater : false,
    isAgriculture : false,
    selectedMWSDrought : null,
    selectWellDepthYear : '2017_22',

    setSettlementName : (stat) => set({settlementName : stat}),
    setMarkerPlaced : (stat) => set({isMarkerPlaced : stat}),
    setFeatureStat : (stat) => set({isFeatureClicked : stat}),
    setCurrentScreen : (screen) => set({currentScreen : screen}),
    setCurrentStep : (step) => set({currentStep : step}),
    setFortnightData : (stat) => set({fortnightData : stat}),
    setSelectedResource : (stat) => set({selectedResource : stat}),
    setMarkerCoords : (stat) => set({markerCoords : stat}),
    setLulcYearIdx : (stat) => set({lulcYearIdx : stat}),
    setIsWaterBody : (stat) => set({iswaterbody : stat}),
    setIsGroundWater : (stat) => set({isGroundWater : stat}),
    setSelectedMwsDrought : (stat) => set({selectedMWSDrought : stat}),
    setIsAgriculture : (stat) => set({isAgriculture : stat}),
    setSelectedWellDepthYear : (stat) => set({selectWellDepthYear : stat}),

    //? NREGA Hooks
    isNregaSheet : false,
    allNregaYears : [],
    selectNregaYears : [2018],
    nregaWorks : [],
    nregaStyle : {
        filter: ['in', ['get', 'workYear'], [2018]],
        'shape-points': 12,
        'shape-radius': 8,
        'shape-fill-color':'#00000000',
    },

    setNregaSheet : (stat) => set({isNregaSheet : stat}),
    setAllNregaYears : (years) => set({allNregaYears : years}),
    setNregaYears : (years) => set({selectNregaYears : years}),
    setNregaWorks : (works) => set({nregaWorks : works}),
    setNregaStyle : (style) => set({nregaStyle : style}),

    
    //? Bottomsheet Hooks
    isOpen : false,
    isResourceOpen : false,
    isForm : false,
    isMetadata : false,
    metadata : null,
    formUrl : "",
    isLoading : false,
    isSubmissionSuccess : false,
    isResource : false,
    resourceType : null,
    isAnalyze : false,
    isLayerStore : false,

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
    setIsLayerStore : (stat) => set({isLayerStore : stat}),
    setIsResourceOpen : (stat) => set({isResourceOpen : stat}),

    acceptedWorkDemandItem: null,
    setAcceptedWorkDemandItem: (item) => {
        console.log('🔄 MainStore - Setting acceptedWorkDemandItem:', item);
        set({ acceptedWorkDemandItem: item });
    },
    clearAcceptedWorkDemandItem: () => {
        console.log('🔄 MainStore - Clearing acceptedWorkDemandItem');
        set({ acceptedWorkDemandItem: null });
    },

    acceptedFromDialog: false,
    setAcceptedFromDialog: () => {
        console.log('🔄 MainStore - Setting acceptedFromDialog: true');
        set({ acceptedFromDialog: true });
    },
    clearAcceptedFromDialog: () => {
        console.log('🔄 MainStore - Clearing acceptedFromDialog');
        set({ acceptedFromDialog: false });
    },

    //? NEW: Dedicated coordinates for accepted work demand items
    acceptedWorkDemandCoords: null,
    setAcceptedWorkDemandCoords: (coords) => {
        console.log('✅ MainStore - setAcceptedWorkDemandCoords called with:', coords);
        set({ acceptedWorkDemandCoords: coords });
    },
    clearAcceptedWorkDemandCoords: () => {
        console.log('🚨 MainStore - clearAcceptedWorkDemandCoords called from:', new Error().stack);
        set({ acceptedWorkDemandCoords: null });
    },

    //? NEW: Store community info for navigation back to items page
    acceptedWorkDemandCommunityId: null,
    acceptedWorkDemandCommunityName: null,
    setAcceptedWorkDemandCommunityInfo: (communityId, communityName) => {
        console.log('🔄 MainStore - Setting acceptedWorkDemandCommunityInfo:', { communityId, communityName });
        set({ acceptedWorkDemandCommunityId: communityId, acceptedWorkDemandCommunityName: communityName });
    },
    clearAcceptedWorkDemandCommunityInfo: () => {
        console.log('🔄 MainStore - Clearing acceptedWorkDemandCommunityInfo');
        set({ acceptedWorkDemandCommunityId: null, acceptedWorkDemandCommunityName: null });
    },

    //? Map Mode Management
    isMapEditable: true,
    userExplicitlyEnabledEditing: false,
    setIsMapEditable: (editable) => {
        console.log('🔄 MainStore - Setting isMapEditable:', editable);
        set({ isMapEditable: editable });
    },
    setUserExplicitlyEnabledEditing: (enabled) => {
        console.log('🔄 MainStore - Setting userExplicitlyEnabledEditing:', enabled);
        set({ userExplicitlyEnabledEditing: enabled });
    },
    clearUserExplicitlyEnabledEditing: () => {
        console.log('🔄 MainStore - Clearing userExplicitlyEnabledEditing');
        set({ userExplicitlyEnabledEditing: false });
    },
    resetMapToEditableMode: () => {
        console.log('🔄 MainStore - Resetting map to editable mode');
        // Only reset if we actually have an accepted work demand item
        set((state) => {
            if (state.acceptedWorkDemandItem || !state.isMapEditable) {
                console.log('🔄 MainStore - Actually resetting map state');
                return {
                    isMapEditable: true,
                    acceptedWorkDemandItem: null,
                    acceptedFromDialog: false,
                    acceptedWorkDemandCoords: null,
                    acceptedWorkDemandCommunityId: null,
                    acceptedWorkDemandCommunityName: null,
                    markerPlaced: false,
                    markerCoords: null,
                    // 🎯 NEW: Preserve the userExplicitlyEnabledEditing flag
                    userExplicitlyEnabledEditing: state.userExplicitlyEnabledEditing
                };
            }
            console.log('🔄 MainStore - No reset needed, already in editable mode');
            return state;
        });
    },
    
    // New function to safely reset map mode only when appropriate
    safeResetMapToEditableMode: () => {
        console.log('🔄 MainStore - Safe reset map to editable mode');
        set((state) => {
            // Don't reset if we're in the middle of processing a work demand
            if (state.acceptedFromDialog) {
                console.log('🔄 MainStore - Safe reset blocked - work demand being processed');
                return state;
            }
            
            if (state.acceptedWorkDemandItem || !state.isMapEditable) {
                console.log('🔄 MainStore - Safe reset proceeding');
                return {
                    isMapEditable: true,
                    acceptedWorkDemandItem: null,
                    acceptedFromDialog: false,
                    acceptedWorkDemandCoords: null,
                    acceptedWorkDemandCommunityId: null,
                    acceptedWorkDemandCommunityName: null,
                    markerPlaced: false,
                    markerCoords: null,
                    // 🎯 NEW: Preserve the userExplicitlyEnabledEditing flag
                    userExplicitlyEnabledEditing: state.userExplicitlyEnabledEditing
                };
            }
            console.log('🔄 MainStore - Safe reset not needed');
            return state;
        });
    },
}))

export default useMainStore;