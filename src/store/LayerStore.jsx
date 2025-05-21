import { create } from "zustand";

const useLayersStore = create((set) => ({
    
    AdminBoundary : false,
    NregaLayer : false,
    WellDepth : false,
    DrainageLayer : false,

    //Resource Layers
    SettlementLayer : false,
    WellLayer : false,
    WaterStructure : false,
    CropGrid : false,
    WorkAgri : false,
    WorkGroundwater : false,
    Livelihood : false,

    //Raster Layer
    CLARTLayer : false,
    LULCLayer : false,

    setAdminBoundary : (stat) => set({AdminBoundary : stat}),
    setNregaLayer : (stat) => set({NregaLayer : stat}),
    setWellDepth : (stat) => set({WellDepth : stat}),
    setDrainageLayer : (stat) => set({DrainageLayer : stat}),

    setSettlementLayer : (stat) => set({SettlementLayer : stat}),
    setWellLayer : (stat) => set({WellLayer : stat}),
    setWaterStructure : (stat) => set({WaterStructure : stat}),
    setCropGrid : (stat) => set({CropGrid : stat}),
    setWorkAgri : (stat) => set({WorkAgri : stat}),
    setWorkGroundwater : (stat) => set({WorkGroundwater : stat}),
    setLivelihood : (stat) => set({Livelihood : stat}),

    setCLARTLayer: (stat) => set({CLARTLayer : stat}),
    setLULCLayer : (stat) => set({LULCLayer : stat})
}))

export default useLayersStore;

