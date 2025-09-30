import { create } from "zustand";
import authService from "../services/authService";

const useMainStore = create((set) => ({
    //? Default Store
    isInfoOpen: false,
    menuOption: null,

    setIsInfoOpen: (stat) => set({ isInfoOpen: stat }),
    setMenuOption: (stat) => set({ menuOption: stat }),

    // Authentication state
    user: null,
    isAuthenticated: false,
    authLoading: true,

    //? Location Store
    districtName: null,
    blockName: null,
    block_id: null,
    isGPSClick: false,
    gpsLocation: null,
    layerClicked: null,
    
    //? NEW: Store homepage URL for navigation back
    homepageUrl : null,

    setDistrictName: (name) => set({ districtName: name }),
    setBlockName: (name) => set({ blockName: name }),
    setBlockId: (id) => set({ block_id: id }),
    setHomepageUrl : (url) => set({homepageUrl : url}),
    setIsGPSClick: (stat) => set({ isGPSClick: stat }),
    setGpsLocation: (stat) => set({ gpsLocation: stat }),
    setLayerClicked: (stat) => set({ layerClicked: stat }),

    // Temporary Store
    startResourceMarking: () =>
        set({
            currentStep: 1,
            isResource: false,
            isFeatureClicked: false,
        }),

    isLayerBox: false,
    setIsLayerBox: (val) => set({ isLayerBox: val }),

    // Init Auth
    initializeAuth: async () => {
        try {
            const authData = await authService.waitForAuth();
            if (authData) {
                set({
                    user: authService.getUserData(),
                    isAuthenticated: true,
                    authLoading: false,
                });
            } else {
                set({
                    user: null,
                    isAuthenticated: false,
                    authLoading: false,
                });
            }
        } catch (error) {
            console.error("Authentication initialization failed:", error);
            set({
                user: null,
                isAuthenticated: false,
                authLoading: false,
            });
        }
    },

    updateUser: (userData) => {
        set({ user: userData, isAuthenticated: !!userData });
    },

    // MARK: Plan Store
    currentPlan: null,
    plans: null,

    fetchPlans: async (projectId = null) => {
        try {
            if (!projectId) {
                const userData = authService.getUserData();
                if (userData?.project_details?.length > 0) {
                    projectId = userData.project_details[0].project_id;
                } else {
                    return;
                }
            }

            const response = await authService.makeAuthenticatedRequest(
                `${import.meta.env.VITE_API_URL}projects/${projectId}/watershed/plans/`,
            );

            if (response.ok) {
                const plans = await response.json();
                console.log(
                    "Plans fetched successfully:",
                    plans.length,
                    "plans",
                );
                set({ plans: plans });
            } else {
                set({ plans: [] });
            }
        } catch (e) {
            console.log("Error details:", e.message);
            set({ plans: [] });
        }
    },

    setCurrentPlan: (id) =>
        set((state) => {
            // Find the plan object from plans array and store it with backward-compatible properties
            const planObj = state.plans?.find((plan) => plan.id === id);
            if (planObj) {
                return { currentPlan: { ...planObj, plan_id: planObj.id } };
            }
            return { currentPlan: null };
        }),

    getCurrentPlanLabel: () => {
        const state = useMainStore.getState();
        if (!state.currentPlan) return "Select Plan";

        const planName = state.currentPlan.plan || "Unknown Plan";
        const capitalizeWords = (str) => {
            return str
                .split(" ")
                .map(
                    (word) =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase(),
                )
                .join(" ");
        };

        const capitalizedPlan = capitalizeWords(planName);
        if (capitalizedPlan.length > 15) {
            return capitalizedPlan.slice(0, 13) + "..";
        }
        return capitalizedPlan;
    },

    // MARK: Layers Hooks
    currentScreen: "HomeScreen",
    currentStep: 0,
    settlementName: "",
    isFeatureClicked: false,
    isMarkerPlaced: false,
    markerCoords: null,
    selectedResource: null,
    fortnightData: null,
    lulcYearIdx: 0,
    isWaterbody: false,
    isGroundWater: false,
    isAgriculture: false,
    selectedMWSDrought: null,
    selectWellDepthYear: "2018_23",

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
    isNregaSheet: false,
    allNregaYears: [],
    selectNregaYears: [2018],
    nregaWorks: [],
    nregaStyle: {
        filter: ["in", ["get", "workYear"], [2018]],
        "shape-points": 12,
        "shape-radius": 8,
        "shape-fill-color": "#00000000",
    },

    setNregaSheet: (stat) => set({ isNregaSheet: stat }),
    setAllNregaYears: (years) => set({ allNregaYears: years }),
    setNregaYears: (years) => set({ selectNregaYears: years }),
    setNregaWorks: (works) => set({ nregaWorks: works }),
    setNregaStyle: (style) => set({ nregaStyle: style }),

    //? Bottomsheet Hooks
    isOpen: false,
    isResourceOpen: false,
    isForm: false,
    isMetadata: false,
    metadata: null,
    formUrl: "",
    isLoading: false,
    isSubmissionSuccess: false,
    isResource: false,
    resourceType: null,
    isAnalyze: false,
    isLayerStore: false,

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
        set({ acceptedWorkDemandItem: item });
    },
    clearAcceptedWorkDemandItem: () => {
        set({ acceptedWorkDemandItem: null });
    },

    acceptedFromDialog: false,
    setAcceptedFromDialog: () => {
        set({ acceptedFromDialog: true });
    },
    clearAcceptedFromDialog: () => {
        set({ acceptedFromDialog: false });
    },

    //? NEW: Dedicated coordinates for accepted work demand items
    acceptedWorkDemandCoords: null,
    setAcceptedWorkDemandCoords: (coords) => {
        set({ acceptedWorkDemandCoords: coords });
    },
    clearAcceptedWorkDemandCoords: () => {
        set({ acceptedWorkDemandCoords: null });
    },

    //? NEW: Store community info for navigation back to items page
    acceptedWorkDemandCommunityId: null,
    acceptedWorkDemandCommunityName: null,
    setAcceptedWorkDemandCommunityInfo: (communityId, communityName) => {
        set({ acceptedWorkDemandCommunityId: communityId, acceptedWorkDemandCommunityName: communityName });
    },
    clearAcceptedWorkDemandCommunityInfo: () => {
        set({ acceptedWorkDemandCommunityId: null, acceptedWorkDemandCommunityName: null });
    },

    //? Map Mode Management
    isMapEditable: true,
    userExplicitlyEnabledEditing: false,
    setIsMapEditable: (editable) => {
        set({ isMapEditable: editable });
    },
    setUserExplicitlyEnabledEditing: (enabled) => {
        set({ userExplicitlyEnabledEditing: enabled });
    },
    clearUserExplicitlyEnabledEditing: () => {
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
