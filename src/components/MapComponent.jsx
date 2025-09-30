                                                                                                                                                                                                                                                                                                                import { useEffect, useRef, useState } from "react";
import useMainStore from "../store/MainStore.jsx";
import useLayersStore from "../store/LayerStore.jsx";
import getWebglVectorLayers from "../action/getWebglVectorLayers.js";
import getVectorLayers from "../action/getVectorLayers.js";
import getWebGlLayers from "../action/getWebglLayers.js";
import getImageLayer from "../action/getImageLayer.js";
import toast from "react-hot-toast";
import SquircleLoader from "./SquircleLoader.jsx";

//* OpenLayers imports
import "ol/ol.css";
import { easeOut } from "ol/easing";
import XYZ from "ol/source/XYZ";
import TileLayer from "ol/layer/Tile";
import Control from "ol/control/Control.js";
import { defaults as defaultControls } from "ol/control/defaults.js";
import { Map, View, Feature, Geolocation } from "ol";
import { Stroke, Fill, Style, Icon, Text } from "ol/style.js";
import VectorLayer from "ol/layer/Vector.js";
import Point from "ol/geom/Point.js";
import Select from "ol/interaction/Select.js";
import WebGLVectorLayer from "ol/layer/WebGLVector.js";
import VectorSource from "ol/source/Vector.js";

import settlementIcon from "../assets/settlement_icon.svg";
import LargeWaterBody from "../assets/waterbodiesScreenIcon.svg";
import RechargeIcon from "../assets/recharge_icon.svg";
import IrrigationIcon from "../assets/irrigation_icon.svg";
import selectedSettlementIcon from "../assets/selected_settlement.svg";
import iconsDetails from "../assets/icons.json";
import mapMarker from "../assets/map_marker.svg";
import itemMarker from "../assets/Item_marker.svg"
import farm_pond_proposed from "../assets/farm_pond_proposed.svg";
import land_leveling_proposed from "../assets/land_leveling_proposed.svg";
import well_mrker from "../assets/well_icon.svg";
import Man_icon from "../assets/Man_icon.png";
import livelihoodIcon from "../assets/livelihood_proposed.svg";
import fisheriesIcon from "../assets/Fisheries.svg";
import plantationsIcon from "../assets/Plantation.svg";

const WATER_STRUCTURE_MAPPING = {
    GROUNDWATER: [
        "check dam",
        "percolation tank",
        "earthern gully plugs",
        "drainage/soakage channels",
        "recharge pits",
        "sokage pits", // should be "soakage pits"
        "trench cum bund network",
        "continuous contour trenches (cct)",
        "staggered contour trenches(sct)",
        "water absorption trenches(wat)",
        "rock fill dam",
        "loose boulder structure",
        "stone bunding",
        "diversion drains",
        "contour bunds/graded bunds",
        "bunding:contour bunds/ graded bunds",
        "5% model structure",
        "30-40 model structure",
    ],

    SURFACE_WATERBODIES: [
        "farm pond",
        "canal",
        "check dam",
        "percolation tank",
        "large water bodies",
        "large water body",
        "irrigation channel",
        "rock fill dam",
        "loose boulder structure",
        "community pond",
    ],

    AGRICULTURE: ["farm pond", "canal", "farm bund", "community pond", "well"],
};

function getWaterStructureStyle(feature) {
    const status = feature.values_;
    const wbsType = status.wbs_type?.toLowerCase() || "";

    if (status.need_maint === "Yes") {
        try {
            if (wbsType === "trench cum bund network") {
                return new Style({
                    image: new Icon({
                        src: iconsDetails.WB_Icons_Maintenance[status.wbs_type],
                        scale: 0.6,
                    }),
                    text: new Text({
                        text: status.wbs_type,
                        font: "14px sans-serif",
                        textAlign: "center",
                        fill: new Fill({ color: "#111" }),
                        stroke: new Stroke({ color: "#fff", width: 3 }),
                        overflow: true,
                        offsetY: 20,
                    }),
                });
            } else {
                return new Style({
                    image: new Icon({
                        src: iconsDetails.WB_Icons_Maintenance[status.wbs_type],
                    }),
                    text: new Text({
                        text: status.wbs_type,
                        font: "14px sans-serif",
                        textAlign: "center",
                        fill: new Fill({ color: "#111" }),
                        stroke: new Stroke({ color: "#fff", width: 3 }),
                        overflow: true,
                        offsetY: 20,
                    }),
                });
            }
        } catch (err) {
            console.log("Maintenance icon not found for:", status.wbs_type);
        }
    }

    if (status.wbs_type in iconsDetails.WB_Icons) {
        return new Style({
            image: new Icon({
                src: iconsDetails.WB_Icons[status.wbs_type],
            }),
            text: new Text({
                text: status.wbs_type,
                font: "14px sans-serif",
                textAlign: "center",
                fill: new Fill({ color: "#111" }),
                stroke: new Stroke({ color: "#fff", width: 3 }),
                overflow: true,
                offsetY: 20,
            }),
        });
    }

    return new Style({
        image: new Icon({ src: LargeWaterBody }),
    });
}

function shouldShowWaterStructure(wbsType, screen) {
    const normalizedType = wbsType?.toLowerCase() || "";

    switch (screen) {
        case "Groundwater":
            return WATER_STRUCTURE_MAPPING.GROUNDWATER.includes(normalizedType);
        case "SurfaceWater":
            return WATER_STRUCTURE_MAPPING.SURFACE_WATERBODIES.includes(
                normalizedType,
            );
        case "Agriculture":
            return WATER_STRUCTURE_MAPPING.AGRICULTURE.includes(normalizedType);
        default:
            return true; // Show all on homepage/default
    }
}


const MapComponent = () => {
    const mapElement = useRef(null);
    const mapRef = useRef(null);
    const viewRef = useRef(null);
    const baseLayerRef = useRef(null);
    const AdminLayerRef = useRef(null);
    const MapMarkerRef = useRef(null);
    const NregaWorkLayerRef = useRef(null);
    const ClartLayerRef = useRef(null)
    const WaterbodiesLayerRef = useRef(null)
    const PositionFeatureRef = useRef(null)
    const GeolocationRef = useRef(null)
    const AcceptedItemLayerRef = useRef(null);
    const GpsLayerRef = useRef(null)
    
    const tempSettlementFeature = useRef(null)
    const tempSettlementLayer = useRef(null)

    const [isLoading, setIsLoading] = useState(false);

    const MainStore = useMainStore((state) => state);
    const LayersStore = useLayersStore((state) => state)

    const acceptedWorkDemandItem = useMainStore((state) => state.acceptedWorkDemandItem);
    const acceptedFromDialog = useMainStore((state) => state.acceptedFromDialog);
    const clearAcceptedFromDialog = useMainStore((state) => state.clearAcceptedFromDialog);
    const clearAcceptedWorkDemandItem = useMainStore((state) => state.clearAcceptedWorkDemandItem);
    const setAcceptedWorkDemandCoords = useMainStore((state) => state.setAcceptedWorkDemandCoords);
    const clearAcceptedWorkDemandCoords = useMainStore((state) => state.clearAcceptedWorkDemandCoords);
    
    // Map mode management
    const isMapEditable = useMainStore((state) => state.isMapEditable);
    const setIsMapEditable = useMainStore((state) => state.setIsMapEditable);
    const setUserExplicitlyEnabledEditing = useMainStore((state) => state.setUserExplicitlyEnabledEditing);
    const clearUserExplicitlyEnabledEditing = useMainStore((state) => state.clearUserExplicitlyEnabledEditing);

    const blockName = useMainStore((state) => state.blockName);
    const districtName = useMainStore((state) => state.districtName);
    const currentPlan = useMainStore((state) => state.currentPlan);
    const setFeatureStat = useMainStore((state) => state.setFeatureStat);
    const setMarkerPlaced = useMainStore((state) => state.setMarkerPlaced);
    const setSelectedResource = useMainStore((state) => state.setSelectedResource)
    const setMarkerCoords = useMainStore((state) => state.setMarkerCoords)
    const setAllNregaYears = useMainStore((state) => state.setAllNregaYears)

    //? Screens
    const currentScreen = useMainStore((state) => state.currentScreen);
    const currentStep = useMainStore((state) => state.currentStep);

    //?                    Settlement       Well         Waterbody     CropGrid
    let assetsLayerRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

    //?                  deltag WellDepth   drainage    fortnight       Works
    let groundwaterRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]

    //?                     17-18       18-19           19-20       20-21           21-22         22-23         23-24
    let LulcLayerRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)]

    //?                   Cropping      Drought        Works
    let AgriLayersRefs = [useRef(null), useRef(null), useRef(null)];
    let LulcYears = {
        0: "17_18",
        1: "18_19",
        2: "19_20",
        3: "20_21",
        4: "21_22",
        5: "22_23",
        6: "23_24",
    };

    let LivelihoodRefs = [useRef(null)];

    const initializeMap = async () => {
        const baseLayer = new TileLayer({
            source: new XYZ({
                url: `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}`,
                maxZoom: 30,
                transition: 500,
            }),
            preload: 4,
        });

        baseLayerRef.current = baseLayer;

        class GoogleLogoControl extends Control {
            constructor() {
                const element = document.createElement('div');
                element.style.pointerEvents = 'none';
                element.style.position = 'absolute';
                element.style.bottom = '5px';
                element.style.left = '5px';
                element.style.background = '#f2f2f27f';
                element.style.fontSize = '10px';
                element.style.padding = '5px';
                element.innerHTML = '&copy; Google Satellite Hybrid contributors';
                super({ element });
            }
        }

        const view = new View({
            center: [78.9, 23.6],
            zoom: 5,
            projection: "EPSG:4326",
            constrainResolution: true,
            smoothExtentConstraint: true,
            smoothResolutionConstraint: true,
        });

        viewRef.current = view

        const map = new Map({
            target: mapElement.current,
            layers: [baseLayer],
            controls: defaultControls().extend([new GoogleLogoControl()]),
            view,
            loadTilesWhileAnimating: true,
            loadTilesWhileInteracting: true,
        });

        let tempCoords = null;

        try {
            navigator.geolocation.getCurrentPosition(
                ({ coords }) => {
                    tempCoords = [coords.longitude, coords.latitude];
                    MainStore.setGpsLocation(tempCoords);
                },
                (err) => console.error("Geo error:", err),
            );

            if (tempCoords === null) {
                throw new Error("User Location missing");
            }
        } catch (e) {
            // Setup geolocation
            const geolocation = new Geolocation({
                trackingOptions: {
                    enableHighAccuracy: true,
                },
                projection: view.getProjection(),
            });

            GeolocationRef.current = geolocation

            GeolocationRef.current.on("change:position", function () {
                const coordinates = GeolocationRef.current.getPosition();
                if (coordinates) {
                    MainStore.setGpsLocation(coordinates);
                }
            });

            GeolocationRef.current.setTracking(true);
        }

        mapRef.current = map;
    };

    const fetchBoundaryAndZoom = async (district, block) => {
        // Only fetch boundary and zoom if we're in editable mode
        if (!isMapEditable) {
            return;
        }

        if (useMainStore.getState().acceptedWorkDemandItem && useMainStore.getState().acceptedFromDialog) {
          // Skip boundary if we just accepted an item; map will center on it
          return;
        }

        setIsLoading(true);
        try {
            const boundaryLayer = await getWebglVectorLayers(
                "panchayat_boundaries",
                `${district.toLowerCase().replace(/\s+/g, "_")}_${block.toLowerCase().replace(/\s+/g, "_")}`,
                true,
                true,
            );

            const nregaWorksLayer = await getWebGlLayers(
                "nrega_assets",
                `${district.toLowerCase().replace(/\s+/g, "_")}_${block.toLowerCase().replace(/\s+/g, "_")}`,
                setAllNregaYears,
                MainStore.nregaStyle,
            );

            boundaryLayer.setOpacity(0);
            nregaWorksLayer.setOpacity(0);

            mapRef.current.addLayer(boundaryLayer);
            mapRef.current.addLayer(nregaWorksLayer);

            AdminLayerRef.current = boundaryLayer;
            NregaWorkLayerRef.current = nregaWorksLayer;

            const vectorSource = boundaryLayer.getSource();

            await new Promise((resolve, reject) => {
                const checkFeatures = () => {
                    if (vectorSource.getFeatures().length > 0) {
                        resolve();
                    } else {
                        vectorSource.once("featuresloadend", () => {
                            vectorSource.getFeatures().length > 0
                                ? resolve()
                                : reject(new Error("No features loaded"));
                        });
                        setTimeout(() => {
                            vectorSource.getFeatures().length > 0
                                ? resolve()
                                : reject(new Error("Timeout loading features"));
                        }, 4000);
                    }
                };
                checkFeatures();
            });

            const extent = vectorSource.getExtent();
            const view = mapRef.current.getView();

            view.cancelAnimations();
            view.animate({
                zoom: Math.max(view.getZoom() - 0.5, 5),
                duration: 750,
            }, () => {
                view.fit(extent, {
                    padding: [50, 50, 50, 50],
                    duration: 1000,
                    maxZoom: 15,
                    easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
                    callback: () => {
                        let opacity = 0;
                        const interval = setInterval(() => {
                            opacity += 0.1;
                            boundaryLayer.setOpacity(opacity);
                            nregaWorksLayer.setOpacity(opacity);
                            if (opacity >= 1) {
                                clearInterval(interval);
                                setIsLoading(false);
                            }
                        }, 50);
                        view.animate({
                            zoom: 13,
                            duration: 600,
                            easing: easeOut,
                        });
                    }
                });
            });

            mapRef.current.on("click", async(e) => {
                // Only allow map interactions in editable mode
                if (!isMapEditable) {
                    return;
                }

                MainStore.setIsMetadata(false)
                MainStore.setIsWaterBody(false)
                MainStore.setIsGroundWater(false)
                MainStore.setIsAgriculture(false)

                const NregaFeature = mapRef.current.forEachFeatureAtPixel(
                    e.pixel,
                    (feature, layer) => {
                        if (layer === NregaWorkLayerRef.current) {
                            return feature;
                        }
                    },
                );

                const deltaGFeature = mapRef.current.forEachFeatureAtPixel(
                    e.pixel,
                    (feature, layer) => {
                        if (layer === groundwaterRefs[0].current) {
                            return feature;
                        }
                    },
                );

                const waterBodyFeature = mapRef.current.forEachFeatureAtPixel(
                    e.pixel,
                    (feature, layer) => {
                        if (layer === WaterbodiesLayerRef.current) {
                            return feature;
                        }
                    },
                );

                const fortnightFeature = mapRef.current.forEachFeatureAtPixel(
                    e.pixel,
                    (feature, layer) => {
                        if (layer === groundwaterRefs[2].current) {
                            return feature;
                        }
                    },
                );

                const croppingFeature = mapRef.current.forEachFeatureAtPixel(
                    e.pixel,
                    (feature, layer) => {
                        if (layer === AgriLayersRefs[0].current) {
                            return feature;
                        }
                    },
                );

                if (NregaFeature) {
                    MainStore.setIsMetadata(true);
                    MainStore.setMetadata(NregaFeature.values_);
                    MainStore.setIsOpen(true);
                }

                if (deltaGFeature !== undefined) {
                    setSelectedResource(deltaGFeature.values_);
                    MainStore.setIsGroundWater(true);
                    const clickedMwsId = deltaGFeature.get("uid");

                    groundwaterRefs[0].current.setStyle((feature) => {
                        if (feature.values_.uid === clickedMwsId) {
                            return new Style({
                                stroke: new Stroke({
                                    color: "#1AA7EC",
                                    width: 1,
                                }),
                                fill: new Fill({
                                    color: "rgba(255, 0, 0, 0.0)",
                                }),
                            });
                        } else {
                            const status = feature.values_;
                            let tempColor;

                            if(status.Net2018_23 < -5){tempColor = "rgba(255, 0, 0, 0.5)"}
                            else if(status.Net2018_23 >= -5 && status.Net2018_23 < -1){tempColor = "rgba(255, 255, 0, 0.5)"}
                            else if(status.Net2018_23 >= -1 && status.Net2018_23 <= 1){tempColor = "rgba(0, 255, 0, 0.5)"}
                            else {tempColor = "rgba(0, 0, 255, 0.5)"}

                            return new Style({
                                stroke: new Stroke({
                                    color: "#1AA7EC",
                                    width: 1,
                                }),
                                fill: new Fill({
                                    color: tempColor,
                                }),
                            });
                        }
                    });
                }

                if (fortnightFeature !== undefined) {
                    MainStore.setFortnightData(fortnightFeature.values_);
                }

                if (waterBodyFeature !== undefined) {
                    setSelectedResource(waterBodyFeature.values_);
                    MainStore.setIsWaterBody(true);
                }

                if (croppingFeature !== undefined) {
                    setSelectedResource(croppingFeature.values_)
                    MainStore.setIsAgriculture(true)
                    const src = AgriLayersRefs[1].current.getSource().getFeatures()
                    MainStore.setSelectedMwsDrought(src.find((f) => f.get('uid') === croppingFeature.values_.uid)?.values_ ?? null)
                }
            });
        } catch (error) {
            console.error("Error loading boundary:", error);
            setIsLoading(false);
            const view = mapRef.current.getView();
            view.setCenter([78.9, 23.6]);
            view.setZoom(5);
        }
    };

    const fetchResourcesLayers = async () => {
        setIsLoading(true);

        const settlementLayer = await getVectorLayers(
            "resources",
            "settlement_" + currentPlan.plan_id + "_" + `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
            true,
            true,
        );

        const wellLayer = await getVectorLayers(
            "resources",
            "well_" + currentPlan.plan_id + "_" + `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
            true,
            true,
        );

        const waterStructureLayer = await getVectorLayers(
            "resources",
            "waterbody_" + currentPlan.plan_id + "_" + `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
            true,
            true,
        );

        const cropGridLayer = await getVectorLayers(
            "crop_grid_layers",
            `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}` + "_grid",
            true,
            true,
        );

        const AgricultureWorkLayer = await getVectorLayers(
            "works",
            `plan_agri_${currentPlan.plan_id}_${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
            true,
            true,
        );

        const GroundWaterWorkLayer = await getVectorLayers(
            "works",
            `plan_gw_${currentPlan.plan_id}_${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
            true,
            true,
        );

        const livelihoodLayer = await getVectorLayers(
            "works",
            `livelihood_${currentPlan.plan_id}_${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
            true,
            true,
        );

        settlementLayer.setStyle(function (feature) {
            const stat = feature.values_;

            return new Style({
                image: new Icon({ src: settlementIcon, scale: 0.4 }),
                text: new Text({
                    text: stat.sett_name,
                    font: "14px sans-serif",
                    textAlign: "center",
                    fill: new Fill({ color: "#111" }),
                    stroke: new Stroke({ color: "#fff", width: 3 }),
                    overflow: true,
                    offsetY: 20,
                }),
            });
        });

        wellLayer.setStyle(function (feature) {
            const status = feature.values_;
            let wellMaintenance = false
            if(status.Well_usage !== undefined){
                const m = status.Well_usage.match(/'is_maintenance_required'\s*:\s*'([^']*)'/i);
                wellMaintenance = m ? m[1].toLowerCase() === 'yes' : wellMaintenance;
            }
            if(status.Well_condi !== undefined){
                const m = status.Well_condi.match(/'select_one_maintenance'\s*:\s*'([^']*)'/i);
                wellMaintenance = m ? m[1].toLowerCase() === 'yes' : wellMaintenance;
            }

            if (status.status_re in iconsDetails.socialMapping_icons.well) {
                return new Style({
                    image: new Icon({
                         image: new Icon({ src: iconsDetails.socialMapping_icons.well[status.status_re] }),
                    }),
                });
            } else if (wellMaintenance) {
                return new Style({
                    image: new Icon({src: iconsDetails.socialMapping_icons.well["maintenance"], scale: 0.5}),
                });
            } else {
                return new Style({
                    image: new Icon({src: iconsDetails.socialMapping_icons.well["proposed"],}),
                });
            }
        });

        waterStructureLayer.setStyle(function (feature) {
            const status = feature.values_;

            if (status.need_maint === "Yes") {
                try {
                    if (
                        status.wbs_type === "Trench cum bund network" ||
                        status.wbs_type === "Water absorption trenches(WAT)" ||
                        status.wbs_type === "Staggered Contour trenches(SCT)"
                    ) {
                        return new Style({
                            image: new Icon({
                                src: iconsDetails.WB_Icons_Maintenance[
                                    status.wbs_type
                                ],
                                scale: 0.6,
                            }),
                            text: new Text({
                                text: status.wbs_type,
                                font: "14px sans-serif",
                                textAlign: "center",
                                fill: new Fill({ color: "#111" }),
                                stroke: new Stroke({ color: "#fff", width: 3 }),
                                overflow: true,
                                offsetY: 20,
                            }),
                        });
                    } else {
                        return new Style({
                            image: new Icon({
                                src: iconsDetails.WB_Icons_Maintenance[
                                    status.wbs_type
                                ],
                            }),
                            text: new Text({
                                text: status.wbs_type,
                                font: "14px sans-serif",
                                textAlign: "center",
                                fill: new Fill({ color: "#111" }),
                                stroke: new Stroke({ color: "#fff", width: 3 }),
                                overflow: true,
                                offsetY: 20,
                            }),
                        });
                    }
                } catch (err) {
                    console.log(status.wbs_type);
                }
            } else if (status.wbs_type in iconsDetails.WB_Icons) {
                return new Style({
                    image: new Icon({
                        src: iconsDetails.WB_Icons[status.wbs_type],
                    }),
                    text: new Text({
                        text: status.wbs_type,
                        font: "14px sans-serif",
                        textAlign: "center",
                        fill: new Fill({ color: "#111" }),
                        stroke: new Stroke({ color: "#fff", width: 3 }),
                        overflow: true,
                        offsetY: 20,
                    }),
                });
            } else {
                return new Style({
                    image: new Icon({ src: LargeWaterBody }),
                    text: new Text({
                        text: status.wbs_type,
                        font: "14px sans-serif",
                        textAlign: "center",
                        fill: new Fill({ color: "#111" }),
                        stroke: new Stroke({ color: "#fff", width: 3 }),
                        overflow: true,
                        offsetY: 20,
                    }),
                });
            }
        });

        AgricultureWorkLayer.setStyle(function (feature) {
            const status = feature.values_;
            if (status.TYPE_OF_WO == "New farm pond") {
                return new Style({
                    image: new Icon({ src: farm_pond_proposed }),
                    text: new Text({
                        text: status.TYPE_OF_WO,
                        font: "14px sans-serif",
                        textAlign: "center",
                        fill: new Fill({ color: "#111" }),
                        stroke: new Stroke({ color: "#fff", width: 3 }),
                        overflow: true,
                        offsetY: 20,
                    }),
                });
            } else if (status.TYPE_OF_WO == "Land leveling") {
                return new Style({
                    image: new Icon({ src: land_leveling_proposed }),
                    text: new Text({
                        text: status.TYPE_OF_WO,
                        font: "14px sans-serif",
                        textAlign: "center",
                        fill: new Fill({ color: "#111" }),
                        stroke: new Stroke({ color: "#fff", width: 3 }),
                        overflow: true,
                        offsetY: 20,
                    }),
                });
            } else if (status.TYPE_OF_WO == "New well") {
                return new Style({
                    image: new Icon({ src: well_mrker }),
                    text: new Text({
                        text: status.TYPE_OF_WO,
                        font: "14px sans-serif",
                        textAlign: "center",
                        fill: new Fill({ color: "#111" }),
                        stroke: new Stroke({ color: "#fff", width: 3 }),
                        overflow: true,
                        offsetY: 20,
                    }),
                });
            } else {
                return new Style({
                    image: new Icon({ src: IrrigationIcon }),
                    text: new Text({
                        text: status.TYPE_OF_WO,
                        font: "14px sans-serif",
                        textAlign: "center",
                        fill: new Fill({ color: "#111" }),
                        stroke: new Stroke({ color: "#fff", width: 3 }),
                        overflow: true,
                        offsetY: 20,
                    }),
                });
            }
        });

        GroundWaterWorkLayer.setStyle(function (feature) {
            const status = feature.values_;
            // if(status.work_type in iconsDetails.Recharge_Icons){
            //     return new Style({
            //         image: new Icon({ src: iconsDetails.Recharge_Icons[status.work_type] }),
            //     })
            // }
            // else{
            return new Style({
                image: new Icon({ src: RechargeIcon }),
                text: new Text({
                    text: status.work_type,
                    font: "14px sans-serif",
                    textAlign: "center",
                    fill: new Fill({ color: "#111" }),
                    stroke: new Stroke({ color: "#fff", width: 3 }),
                    overflow: true,
                    offsetY: 20,
                }),
            });
            //}
        });

        livelihoodLayer.setStyle(function (feature) {
            const stat = feature.values_;
            // console.log(stat)
            if (feature.values_.select_o_5 === "Yes") {
                return new Style({
                    image: new Icon({ src: livelihoodIcon }),
                });
            } else if (feature.values_.select_o_6 === "Yes") {
                return new Style({
                    image: new Icon({ src: fisheriesIcon }),
                });
            } else {
                return new Style({
                    image: new Icon({ src: plantationsIcon }),
                });
            }
        });

        if (assetsLayerRefs[0].current !== null) {
            mapRef.current.removeLayer(assetsLayerRefs[0].current);
        }
        if (assetsLayerRefs[1].current !== null) {
            mapRef.current.removeLayer(assetsLayerRefs[1].current);
        }
        if (assetsLayerRefs[2].current !== null) {
            mapRef.current.removeLayer(assetsLayerRefs[2].current);
        }
        if (AgriLayersRefs[2].current !== null) {
            mapRef.current.removeLayer(AgriLayersRefs[2].current);
        }

        assetsLayerRefs[0].current = settlementLayer;
        assetsLayerRefs[1].current = wellLayer;
        assetsLayerRefs[2].current = waterStructureLayer;
        assetsLayerRefs[3].current = cropGridLayer;
        AgriLayersRefs[2].current = AgricultureWorkLayer;
        groundwaterRefs[3].current = GroundWaterWorkLayer;
        LivelihoodRefs[0].current = livelihoodLayer;

        mapRef.current.addLayer(assetsLayerRefs[0].current);
        mapRef.current.addLayer(assetsLayerRefs[1].current);
        mapRef.current.addLayer(assetsLayerRefs[2].current);

        //? Adding Marker to the Map on Click
        const markerFeature = new Feature();
        const iconStyle = new Style({
            image: new Icon({
                anchor: [0.5, 46],
                anchorXUnits: "fraction",
                anchorYUnits: "pixels",
                src: mapMarker,
            }),
        });
        MapMarkerRef.current = new VectorLayer({
            map: mapRef.current,
            source: new VectorSource({
                features: [markerFeature],
            }),
            style: iconStyle,
        });

        //? Interactions
        const settle_style = new Style({
            image: new Icon({ src: selectedSettlementIcon }),
        });

        const selectSettleIcon = new Select({ style: settle_style });

        tempSettlementFeature.current = new Feature();

        tempSettlementLayer.current = new VectorLayer({
            map: mapRef.current,
            source: new VectorSource({
                features: [tempSettlementFeature.current],
            }),
            style: settle_style,
        });
        tempSettlementLayer.current.setVisible(false);

        mapRef.current.on("click", (e) => {

            if (!isMapEditable) {
                console.log("❌ Map not editable, blocking click");
                return;
            }

            if (acceptedWorkDemandItem && currentPlan) {
                console.log("❌ Planning mode with work demand item, blocking marker placement");
                return; // Exit early - no new markers allowed in planning mode
            }

            console.log("✅ Allowing marker placement");
            setFeatureStat(false)
            setMarkerPlaced(true)
            setMarkerCoords(e.coordinate)
            MainStore.setIsResource(false)

            markerFeature.setGeometry(new Point(e.coordinate));
            MapMarkerRef.current.setVisible(true);

            mapRef.current.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
              if (layer === assetsLayerRefs[0].current) {
                MainStore.setResourceType("Settlement");
                setFeatureStat(true);
                mapRef.current.addInteraction(selectSettleIcon);
                setSelectedResource(feature.values_);
                tempSettlementFeature.current.setGeometry(new Point(e.coordinate),);
                MainStore.setSettlementName(feature.values_.sett_name);
                MainStore.setIsResource(true);
                MainStore.setIsResourceOpen(true);
              }
              else if (layer === assetsLayerRefs[1].current) {
                MainStore.setResourceType("Well")
                mapRef.current.removeInteraction(selectSettleIcon)
                setSelectedResource(feature.values_)
                setFeatureStat(true)
                MainStore.setIsResource(true)
                MainStore.setIsResourceOpen(true)
              }
              else if (layer === assetsLayerRefs[2].current) {
                MainStore.setResourceType("Waterbody")
                mapRef.current.removeInteraction(selectSettleIcon)
                setSelectedResource(feature.values_)
                setFeatureStat(true)
                MainStore.setIsResource(true)
                MainStore.setIsResourceOpen(true)
              }
              else if(layer === assetsLayerRefs[3].current){
                MainStore.setResourceType("Cropgrid")
                setSelectedResource(feature.values_)
                setFeatureStat(true)
              }
              else if(layer === LivelihoodRefs[0].current){
                MainStore.setResourceType("Livelihood")
                mapRef.current.removeInteraction(selectSettleIcon)
                setSelectedResource(feature.values_)
                setFeatureStat(true)
                MainStore.setIsResource(true)
              }
              else if(layer === groundwaterRefs[3].current){
                MainStore.setResourceType("Recharge")
                mapRef.current.removeInteraction(selectSettleIcon)
                tempSettlementLayer.current.setVisible(false)
                setSelectedResource(feature.values_)
                setFeatureStat(true)
                MainStore.setIsResource(true)
              }
              else if(layer === AgriLayersRefs[2].current){
                setFeatureStat(true)
                setSelectedResource(feature.values_)
                console.log(feature)
                MainStore.setResourceType("Irrigation")
                mapRef.current.removeInteraction(selectSettleIcon)
                MainStore.setIsResource(true)
                tempSettlementLayer.current.setVisible(false)
              }

            if (
                feature.geometryChangeKey_.target.flatCoordinates[0] === GeolocationRef.current.position_[0] &&
                feature.geometryChangeKey_.target.flatCoordinates[1] === GeolocationRef.current.position_[1]
            ) {
                mapRef.current.removeInteraction(selectSettleIcon);
            }
            });
        });
        setIsLoading(false);
    };

    const refreshResourceLayers = async () => {
        if (currentScreen === "Resource_mapping") {
            mapRef.current.removeLayer(assetsLayerRefs[currentStep].current);

            if (currentStep === 0) {
                const settlementLayer = await getVectorLayers(
                    "resources",
                    "settlement_" +
                        currentPlan.plan_id +
                        "_" +
                        `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                    true,
                    true,
                );

                const tol = 1e-6;

                settlementLayer.setStyle(function (feature) {
                    const geom = feature.getGeometry();
                    const [x, y] = geom.getCoordinates();
                    if (Math.abs(x - MainStore.markerCoords[0]) < tol && Math.abs(y - MainStore.markerCoords[1]) < tol) {
                        MainStore.setSettlementName(feature.values_.sett_name);
                    }
                    return new Style({
                        image: new Icon({ src: settlementIcon, scale: 0.4 }),
                        text: new Text({
                            text: feature.values_.sett_name,
                            font: "14px sans-serif",
                            textAlign: "center",
                            fill: new Fill({ color: "#111" }),
                            stroke: new Stroke({ color: "#fff", width: 3 }),
                            overflow: true,
                            offsetY: 20,
                        }),
                    });
                });

                tempSettlementFeature.current.setGeometry(new Point(MainStore.markerCoords))
                
                // 🎯 FIXED: Don't automatically advance to step 1 in work demand flow
                // Only advance if we're not processing an accepted work demand item
                // if (!MainStore.acceptedWorkDemandItem) {
                //     MainStore.setCurrentStep(1);
                // } else {
                //     console.log('🎯 MapComponent - Keeping currentStep at 0 for work demand flow');
                // }
                
                assetsLayerRefs[0].current = settlementLayer
            }

            else if(currentStep === 1){
                const wellLayer = await getVectorLayers(
                    "resources",
                    "well_" +
                        currentPlan.plan_id +
                        "_" +
                        `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                    true,
                    true,
                );
                wellLayer.setStyle(function (feature) {
                    const status = feature.values_;
                    let wellMaintenance = false
                    if(status.Well_usage !== undefined){
                        const m = status.Well_usage.match(/'is_maintenance_required'\s*:\s*'([^']*)'/i);
                        wellMaintenance = m ? m[1].toLowerCase() === 'yes' : wellMaintenance;
                    }
                    if(status.Well_condi !== undefined){
                        const m = status.Well_condi.match(/'select_one_maintenance'\s*:\s*'([^']*)'/i);
                        wellMaintenance = m ? m[1].toLowerCase() === 'yes' : wellMaintenance;
                    }

                    if (status.status_re in iconsDetails.socialMapping_icons.well) {
                        return new Style({
                            image: new Icon({
                                src: iconsDetails.socialMapping_icons.well[
                                    status.status_re
                                ],
                            }),
                        });
                    } else if (wellMaintenance) {
                        return new Style({
                            image: new Icon({
                                src: iconsDetails.socialMapping_icons.well[
                                    "maintenance"
                                ],
                                scale: 0.5,
                            }),
                        });
                    } else {
                        return new Style({
                            image: new Icon({ src: iconsDetails.socialMapping_icons.well["proposed"] }),
                        })
                    }
                });

                assetsLayerRefs[1].current = wellLayer
            }
            else if(currentStep === 2){
                const waterStructureLayer = await getVectorLayers(
                    "resources",
                    "waterbody_" +
                        currentPlan.plan_id +
                        "_" +
                        `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                    true,
                    true,
                );

                waterStructureLayer.setStyle(function (feature) {
                    const status = feature.values_;

                    if (status.need_maint === "Yes") {
                        try {
                            if (
                                status.wbs_type === "Trench cum bund network" ||
                                status.wbs_type ===
                                    "Water absorption trenches(WAT)" ||
                                status.wbs_type ===
                                    "Staggered Contour trenches(SCT)"
                            ) {
                                return new Style({
                                    image: new Icon({
                                        src: iconsDetails.WB_Icons_Maintenance[
                                            status.wbs_type
                                        ],
                                        scale: 0.6,
                                    }),
                                    text: new Text({
                                        text: status.wbs_type,
                                        font: "14px sans-serif",
                                        textAlign: "center",
                                        fill: new Fill({ color: "#111" }),
                                        stroke: new Stroke({
                                            color: "#fff",
                                            width: 3,
                                        }),
                                        overflow: true,
                                        offsetY: 20,
                                    }),
                                });
                            } else {
                                return new Style({
                                    image: new Icon({
                                        src: iconsDetails.WB_Icons_Maintenance[
                                            status.wbs_type
                                        ],
                                    }),
                                    text: new Text({
                                        text: status.wbs_type,
                                        font: "14px sans-serif",
                                        textAlign: "center",
                                        fill: new Fill({ color: "#111" }),
                                        stroke: new Stroke({
                                            color: "#fff",
                                            width: 3,
                                        }),
                                        overflow: true,
                                        offsetY: 20,
                                    }),
                                });
                            }
                        } catch (err) {
                            console.log(status.wbs_type);
                        }
                    } else if (status.wbs_type in iconsDetails.WB_Icons) {
                        return new Style({
                            image: new Icon({
                                src: iconsDetails.WB_Icons[status.wbs_type],
                            }),
                            text: new Text({
                                text: status.wbs_type,
                                font: "14px sans-serif",
                                textAlign: "center",
                                fill: new Fill({ color: "#111" }),
                                stroke: new Stroke({ color: "#fff", width: 3 }),
                                overflow: true,
                                offsetY: 20,
                            }),
                        });
                    } else {
                        return new Style({
                            image: new Icon({ src: LargeWaterBody }),
                            text: new Text({
                                text: status.wbs_type,
                                font: "14px sans-serif",
                                textAlign: "center",
                                fill: new Fill({ color: "#111" }),
                                stroke: new Stroke({ color: "#fff", width: 3 }),
                                overflow: true,
                                offsetY: 20,
                            }),
                        });
                    }
                });

                assetsLayerRefs[2].current = waterStructureLayer;
            }

            mapRef.current.addLayer(assetsLayerRefs[currentStep].current);

        } 
        else if (currentScreen === "Groundwater") {
            const GroundWaterWorkLayer = await getVectorLayers(
                "works",
                `plan_gw_${currentPlan.plan_id}_${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                true,
                true,
            );
            GroundWaterWorkLayer.setStyle(function (feature) {
                const status = feature.values_;
                return new Style({
                    image: new Icon({ src: RechargeIcon }),
                    text: new Text({
                        text: status.work_type,
                        font: "14px sans-serif",
                        textAlign: "center",
                        fill: new Fill({ color: "#111" }),
                        stroke: new Stroke({ color: "#fff", width: 3 }),
                        overflow: true,
                        offsetY: 20,
                    }),
                });
            });

            mapRef.current.removeLayer(groundwaterRefs[2].current);
            groundwaterRefs[3].current = GroundWaterWorkLayer;
            mapRef.current.addLayer(groundwaterRefs[3].current);
        } 
        else if (currentScreen === "Agriculture") {
            const AgricultureWorkLayer = await getVectorLayers(
                "works",
                `plan_agri_${currentPlan.plan_id}_${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                true,
                true,
            );
            AgricultureWorkLayer.setStyle(function (feature) {
                const status = feature.values_;
                if (status.TYPE_OF_WO == "New farm pond") {
                    return new Style({
                        image: new Icon({ src: farm_pond_proposed }),
                        text: new Text({
                            text: status.TYPE_OF_WO,
                            font: "14px sans-serif",
                            textAlign: "center",
                            fill: new Fill({ color: "#111" }),
                            stroke: new Stroke({ color: "#fff", width: 3 }),
                            overflow: true,
                            offsetY: 20,
                        }),
                    });
                } else if (status.TYPE_OF_WO == "Land leveling") {
                    return new Style({
                        image: new Icon({ src: land_leveling_proposed }),
                        text: new Text({
                            text: status.TYPE_OF_WO,
                            font: "14px sans-serif",
                            textAlign: "center",
                            fill: new Fill({ color: "#111" }),
                            stroke: new Stroke({ color: "#fff", width: 3 }),
                            overflow: true,
                            offsetY: 20,
                        }),
                    });
                } else if (status.TYPE_OF_WO == "New well") {
                    return new Style({
                        image: new Icon({ src: well_mrker }),
                        text: new Text({
                            text: status.TYPE_OF_WO,
                            font: "14px sans-serif",
                            textAlign: "center",
                            fill: new Fill({ color: "#111" }),
                            stroke: new Stroke({ color: "#fff", width: 3 }),
                            overflow: true,
                            offsetY: 20,
                        }),
                    });
                } else {
                    return new Style({
                        image: new Icon({ src: IrrigationIcon }),
                        text: new Text({
                            text: status.TYPE_OF_WO,
                            font: "14px sans-serif",
                            textAlign: "center",
                            fill: new Fill({ color: "#111" }),
                            stroke: new Stroke({ color: "#fff", width: 3 }),
                            overflow: true,
                            offsetY: 20,
                        }),
                    });
                }
            });

            mapRef.current.removeLayer(AgriLayersRefs[2].current);
            AgriLayersRefs[2].current = AgricultureWorkLayer;
            mapRef.current.addLayer(AgriLayersRefs[2].current);
        } 
        else if (currentScreen === "Livelihood") {
            const livelihoodLayer = await getVectorLayers(
                "works",
                `livelihood_${currentPlan.plan_id}_${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                true,
                true,
            );
            livelihoodLayer.setStyle(function (feature) {
                const stat = feature.values_;
                if (feature.values_.select_o_3 === "Yes") {
                    return new Style({
                        image: new Icon({ src: livelihoodIcon }),
                    });
                } else if (feature.values_.select_one === "Yes") {
                    return new Style({
                        image: new Icon({ src: fisheriesIcon }),
                    });
                } else {
                    return new Style({
                        image: new Icon({ src: plantationsIcon }),
                    });
                }
            });
            mapRef.current.removeLayer(LivelihoodRefs[0].current);
            LivelihoodRefs[0].current = livelihoodLayer;
            mapRef.current.addLayer(LivelihoodRefs[0].current);
        }
    };

    const updateLayersOnStep = async () => {
        const layerCollection = mapRef.current.getLayers();

        if(currentScreen === "Resource_mapping"){
            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current && layer !== MapMarkerRef.current) {
                    layerCollection.remove(layer);
                }
            });

            MapMarkerRef.current.setVisible(false);
            // Only reset marker placement if there's no accepted work demand item
            if (!acceptedWorkDemandItem) {
                setMarkerPlaced(false);
            }

            mapRef.current.addLayer(assetsLayerRefs[currentStep].current);
            if (currentStep > 0) {
                tempSettlementLayer.current.setVisible(true);
            }
            if (currentStep === 2) {
                if (WaterbodiesLayerRef.current === null) {
                    const waterBodyLayers = await getWebglVectorLayers(
                        "swb",
                        `surface_waterbodies_${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                        true,
                        true,
                    );
                    WaterbodiesLayerRef.current = waterBodyLayers;
                }
                mapRef.current.addLayer(WaterbodiesLayerRef.current);
            }

        }
        else if(currentScreen === "Groundwater"){

            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current && layer !== MapMarkerRef.current && layer !== AcceptedItemLayerRef.current) {
                    layerCollection.remove(layer);
                }
            });
            
            //? Code has been changed here from previous ones, the previous was working fine, check previous commit and match the changes, the offline has the code in the commit before this
            // Step 0
            if (currentStep === 0) {
                if (groundwaterRefs[2].current !== null) {
                    mapRef.current.addLayer(groundwaterRefs[2].current); // Fortnight layer
                }
                if (groundwaterRefs[0].current !== null) {
                    mapRef.current.addLayer(groundwaterRefs[0].current); // Well depth layer
                }

                mapRef.current.addLayer(assetsLayerRefs[0].current); // Settlement layer
                mapRef.current.addLayer(assetsLayerRefs[2].current);
                mapRef.current.addLayer(groundwaterRefs[3].current); // Works layer

                LayersStore.setSettlementLayer(true);
                LayersStore.setWellDepth(true);
                LayersStore.setDrainageLayer(false);
                LayersStore.setCLARTLayer(false);
                LayersStore.setWaterStructure(false);
                LayersStore.setWorkGroundwater(true);
            }

            // Step 1: In the planning step
            if (currentStep === 1) {
                if (ClartLayerRef.current !== null) {
                    ClartLayerRef.current.setOpacity(0.4);
                    mapRef.current.addLayer(ClartLayerRef.current); // CLART layer
                }
                if (groundwaterRefs[1].current !== null) {
                    mapRef.current.addLayer(groundwaterRefs[1].current); // Drainage layer
                }
                if (groundwaterRefs[3].current !== null) {
                    mapRef.current.addLayer(groundwaterRefs[3].current); // Works layer
                }
                mapRef.current.addLayer(assetsLayerRefs[2].current);

                LayersStore.setSettlementLayer(true);
                LayersStore.setWellDepth(false);
                LayersStore.setDrainageLayer(true);
                LayersStore.setCLARTLayer(true);
                LayersStore.setWaterStructure(false);
                LayersStore.setWorkGroundwater(true);
            }

            // Restore accepted item layer if it exists
            if (AcceptedItemLayerRef.current && !mapRef.current.getLayers().getArray().includes(AcceptedItemLayerRef.current)) {
                mapRef.current.addLayer(AcceptedItemLayerRef.current);
            }

        }

        else if(currentScreen === "Agriculture"){
            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current && layer !== AgriLayersRefs[0].current && layer !== MapMarkerRef.current && layer !== AcceptedItemLayerRef.current) {
                    layerCollection.remove(layer);
                }
            });

            if (currentStep === 0) {
                mapRef.current.addLayer(LulcLayerRefs[0].current);
                mapRef.current.addLayer(AgriLayersRefs[0].current);
                mapRef.current.addLayer(AgriLayersRefs[1].current);
                mapRef.current.addLayer(AgriLayersRefs[2].current);
                mapRef.current.addLayer(assetsLayerRefs[0].current);
                mapRef.current.addLayer(assetsLayerRefs[1].current);
                mapRef.current.addLayer(assetsLayerRefs[2].current);
            }
            if (currentStep === 1) {
                if (
                    !layerCollection
                        .getArray()
                        .some((layer) => layer === ClartLayerRef.current)
                ) {
                    mapRef.current.addLayer(ClartLayerRef.current);
                    LayersStore.setCLARTLayer(true);
                } else {
                    LayersStore.setCLARTLayer(false);
                }

                if (
                    !layerCollection
                        .getArray()
                        .some((layer) => layer === groundwaterRefs[1].current)
                ) {
                    mapRef.current.addLayer(groundwaterRefs[1].current);
                    LayersStore.setDrainageLayer(true);
                } else {
                    LayersStore.setDrainageLayer(false);
                }
                //mapRef.current.addLayer(assetsLayerRefs[1].current)
                mapRef.current.addLayer(assetsLayerRefs[2].current);
                mapRef.current.addLayer(AgriLayersRefs[2].current);
            }

            // Restore accepted item layer if it exists
            if (AcceptedItemLayerRef.current && !mapRef.current.getLayers().getArray().includes(AcceptedItemLayerRef.current)) {
                mapRef.current.addLayer(AcceptedItemLayerRef.current);
            }
        }

        else if(currentScreen === "Livelihood"){
            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current && layer !== AcceptedItemLayerRef.current) {
                    layerCollection.remove(layer);
                }
            });

            if (currentStep === 0) {
                mapRef.current.addLayer(assetsLayerRefs[0].current);
            }

            MapMarkerRef.current.setVisible(false);
            // Only reset marker placement if there's no accepted work demand item
            if (!acceptedWorkDemandItem) {
                setMarkerPlaced(false);
            }

            if(currentStep > 0){
                mapRef.current.addLayer(LivelihoodRefs[0].current)
                tempSettlementLayer.current.setVisible(true)
            }

            // Restore accepted item layer if it exists
            if (AcceptedItemLayerRef.current && !mapRef.current.getLayers().getArray().includes(AcceptedItemLayerRef.current)) {
                mapRef.current.addLayer(AcceptedItemLayerRef.current);
            }
        }
    }

    const updateLayersOnScreen = async () => {
        const layerCollection = mapRef.current.getLayers();

        if(currentScreen === "HomeScreen"){
            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current) {
                    layerCollection.remove(layer);
                }
            });
            if(NregaWorkLayerRef.current !== null){
                mapRef.current.addLayer(NregaWorkLayerRef.current)
            }
            if (assetsLayerRefs[0].current !== null) {
                mapRef.current.addLayer(assetsLayerRefs[0].current);
                mapRef.current.addLayer(assetsLayerRefs[1].current);
                assetsLayerRefs[2].current.setStyle(getWaterStructureStyle);
                mapRef.current.addLayer(assetsLayerRefs[2].current);
            }
            if (MapMarkerRef.current !== null) {
                MapMarkerRef.current.setVisible(false);
                tempSettlementLayer.current.setVisible(false);
            }

            // Restore accepted item layer if it exists and we're in non-editable mode
            if (AcceptedItemLayerRef.current && !isMapEditable && !mapRef.current.getLayers().getArray().includes(AcceptedItemLayerRef.current)) {
                mapRef.current.addLayer(AcceptedItemLayerRef.current);
            }
        }
        else if(currentScreen === "Resource_mapping"){
            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current && layer !== MapMarkerRef.current && layer !== AcceptedItemLayerRef.current) {
                    layerCollection.remove(layer);
                }
            });
            mapRef.current.addLayer(assetsLayerRefs[currentStep].current)
            MainStore.setFeatureStat(false)
            // Only reset marker placement if there's no accepted work demand item
            if (!acceptedWorkDemandItem) {
                MainStore.setMarkerPlaced(false);
            }

            // Restore accepted item layer if it exists
            if (AcceptedItemLayerRef.current && !mapRef.current.getLayers().getArray().includes(AcceptedItemLayerRef.current)) {
                mapRef.current.addLayer(AcceptedItemLayerRef.current);
            }
        }
        else if(currentScreen === "Groundwater"){
            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current && layer !== AcceptedItemLayerRef.current) {
                    layerCollection.remove(layer);
                }
            });

            if (groundwaterRefs[0].current === null && currentStep === 0) {
                const deltaGWellDepth = await getVectorLayers(
                    "mws_layers",
                    "deltaG_well_depth_" +
                        `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                    true,
                    true,
                );
                groundwaterRefs[0].current = deltaGWellDepth;
            }

            if (groundwaterRefs[2].current === null && currentStep === 0) {
                const deltaGWellDepthFortnight = await getVectorLayers(
                    "mws_layers",
                    "deltaG_fortnight_" +
                        `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                    true,
                    true,
                );
                groundwaterRefs[2].current = deltaGWellDepthFortnight;
            }

            if (groundwaterRefs[1].current === null) {
                const drainageLayer = await getWebglVectorLayers(
                    "drainage",
                    `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                    true,
                    true,
                );
                groundwaterRefs[1].current = drainageLayer;
            }

            if (ClartLayerRef.current === null) {
                const ClartLayer = await getImageLayer(
                    "clart",
                    `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}` +
                        "_clart",
                    true,
                    "",
                );
                ClartLayer.setOpacity(0.4);
                ClartLayerRef.current = ClartLayer;
            }

            groundwaterRefs[0].current.setStyle(function (feature) {
                const status = feature.values_;
                let tempColor;

                if (status.Net2018_23 < -5) {
                    tempColor = "rgba(255, 0, 0, 0.5)";
                } else if (status.Net2018_23 >= -5 && status.Net2018_23 < -1) {
                    tempColor = "rgba(255, 255, 0, 0.5)";
                } else if (status.Net2018_23 >= -1 && status.Net2018_23 <= 1) {
                    tempColor = "rgba(0, 255, 0, 0.5)";
                } else {
                    tempColor = "rgba(0, 0, 255, 0.5)";
                }

                return new Style({
                    stroke: new Stroke({
                        color: "#1AA7EC",
                        width: 1,
                    }),
                    fill: new Fill({
                        color: tempColor,
                    }),
                });
            });
            mapRef.current.addLayer(groundwaterRefs[2].current);
            mapRef.current.addLayer(groundwaterRefs[currentStep].current);
            mapRef.current.addLayer(assetsLayerRefs[0].current);
            mapRef.current.addLayer(groundwaterRefs[3].current);
            assetsLayerRefs[2].current.setStyle(function (feature) {
                if (
                    shouldShowWaterStructure(
                        feature.get("wbs_type"),
                        "Groundwater",
                    )
                ) {
                    return getWaterStructureStyle(feature);
                }
                return null;
            });
            mapRef.current.addLayer(assetsLayerRefs[2].current)

            // Restore accepted item layer if it exists
            if (AcceptedItemLayerRef.current && !mapRef.current.getLayers().getArray().includes(AcceptedItemLayerRef.current)) {
                mapRef.current.addLayer(AcceptedItemLayerRef.current);
            }

            LayersStore.setAdminBoundary(true)
            LayersStore.setWellDepth(true)
            LayersStore.setSettlementLayer(true)
            LayersStore.setWaterStructure(true)
            LayersStore.setWorkGroundwater(true)
        }
        else if(currentScreen === "SurfaceWater"){
            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current && layer !== AcceptedItemLayerRef.current) {
                    layerCollection.remove(layer);
                }
            });

            if (WaterbodiesLayerRef.current === null && currentStep === 0) {
                const waterBodyLayers = await getWebglVectorLayers(
                    "swb",
                    `surface_waterbodies_${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                    true,
                    true,
                );
                WaterbodiesLayerRef.current = waterBodyLayers;
            }
            if (groundwaterRefs[1].current === null && currentStep === 0) {
                const drainageLayer = await getWebglVectorLayers(
                    "drainage",
                    `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                    true,
                    true,
                );
                groundwaterRefs[1].current = drainageLayer;
            }

            assetsLayerRefs[2].current.setStyle(function (feature) {
                if (
                    shouldShowWaterStructure(
                        feature.get("wbs_type"),
                        "SurfaceWater",
                    )
                ) {
                    return getWaterStructureStyle(feature);
                }
                return null;
            });

            mapRef.current.addLayer(NregaWorkLayerRef.current)
            mapRef.current.addLayer(WaterbodiesLayerRef.current)
            mapRef.current.addLayer(groundwaterRefs[1].current)
            mapRef.current.addLayer(assetsLayerRefs[2].current)

            // Restore accepted item layer if it exists
            if (AcceptedItemLayerRef.current && !mapRef.current.getLayers().getArray().includes(AcceptedItemLayerRef.current)) {
                mapRef.current.addLayer(AcceptedItemLayerRef.current);
            }
        }
        else if(currentScreen === "Agriculture"){
            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current && layer !== AcceptedItemLayerRef.current) {
                    layerCollection.remove(layer);
                }
            });

            if (AgriLayersRefs[0].current === null) {
                let CroppingIntensity = await getWebglVectorLayers(
                    "crop_intensity",
                    `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}_intensity`,
                    true,
                    true,
                );
                AgriLayersRefs[0].current = CroppingIntensity;
            }

            if (AgriLayersRefs[1].current === null) {
                let DroughtIntensity = await getWebglVectorLayers(
                    "cropping_drought",
                    `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}_drought`,
                    true,
                    true,
                );
                AgriLayersRefs[1].current = DroughtIntensity;
            }

            if (LulcLayerRefs[0].current === null) {
                let lulcLayer = await getImageLayer(
                    "LULC_level_3",
                    `LULC_17_18_${blockName.toLowerCase().replace(/\s+/g, "_")}_level_3`,
                    true,
                    "",
                );
                LulcLayerRefs[0].current = lulcLayer;
                LulcLayerRefs[0].current.setOpacity(0.6);
            }

            if (ClartLayerRef.current === null) {
                const ClartLayer = await getImageLayer(
                    "clart",
                    `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}` +
                        "_clart",
                    true,
                    "",
                );
                ClartLayer.setOpacity(0.4);
                ClartLayerRef.current = ClartLayer;
            }

            if (groundwaterRefs[1].current === null) {
                const drainageLayer = await getWebglVectorLayers(
                    "drainage",
                    `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                    true,
                    true,
                );
                groundwaterRefs[1].current = drainageLayer;
            }

            mapRef.current.addLayer(LulcLayerRefs[0].current)
            mapRef.current.addLayer(AgriLayersRefs[0].current)
            mapRef.current.addLayer(AgriLayersRefs[1].current)
            mapRef.current.addLayer(AgriLayersRefs[2].current)
            mapRef.current.addLayer(assetsLayerRefs[0].current)

            // Restore accepted item layer if it exists
            if (AcceptedItemLayerRef.current && !mapRef.current.getLayers().getArray().includes(AcceptedItemLayerRef.current)) {
                mapRef.current.addLayer(AcceptedItemLayerRef.current);
            }

            mapRef.current.addLayer(assetsLayerRefs[1].current)

            assetsLayerRefs[2].current.setStyle(function (feature) {
                if (
                    shouldShowWaterStructure(
                        feature.get("wbs_type"),
                        "Agriculture",
                    )
                ) {
                    return getWaterStructureStyle(feature);
                }
                return null;
            });

            mapRef.current.addLayer(assetsLayerRefs[2].current);

            LayersStore.setAdminBoundary(true);
            LayersStore.setLULCLayer(true);
            LayersStore.setWorkAgri(true);

            if (
                !layerCollection
                    .getArray()
                    .some((layer) => layer === ClartLayerRef.current)
            ) {
                LayersStore.setCLARTLayer(false);
            }
        }
        else if(currentScreen === "Livelihood"){
            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current && layer !== AcceptedItemLayerRef.current) {
                    layerCollection.remove(layer);
                }
            });

            mapRef.current.addLayer(assetsLayerRefs[0].current)

            // Restore accepted item layer if it exists
            if (AcceptedItemLayerRef.current && !mapRef.current.getLayers().getArray().includes(AcceptedItemLayerRef.current)) {
                mapRef.current.addLayer(AcceptedItemLayerRef.current);
            }
            mapRef.current.addLayer(LivelihoodRefs[0].current)
        }
    }

    const updateLulcLayer = async() => {
        if(currentScreen === "Agriculture"){
            if(LulcLayerRefs[MainStore.lulcYearIdx].current === null){
                let lulcLayer = await getImageLayer(
                    "LULC_level_3",
                    `LULC_${LulcYears[MainStore.lulcYearIdx]}_${blockName.toLowerCase().replace(/\s+/g, "_")}_level_3`,
                    true,
                    "",
                );
                LulcLayerRefs[MainStore.lulcYearIdx].current = lulcLayer;
                LulcLayerRefs[MainStore.lulcYearIdx].current.setOpacity(0.6);
            }

            LulcLayerRefs.forEach((item) => {
                if (item.current !== null)
                    mapRef.current.removeLayer(item.current);
            });

            mapRef.current.addLayer(
                LulcLayerRefs[MainStore.lulcYearIdx].current,
            );
        }
    };

    useEffect(() => {
        if (PositionFeatureRef.current === null && mapRef.current !== null) {
            const positionFeature = new Feature();

            positionFeature.setStyle(new Style({
                image: new Icon({
                    src: Man_icon,
                    scale: 0.8,
                    anchor: [0.5, 0.5],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'fraction',
                }),
            }));

            // Store reference to position feature
            PositionFeatureRef.current = positionFeature;

            let tempCoords = MainStore.gpsLocation
            if(tempCoords === null){
                try{
                    navigator.geolocation.getCurrentPosition(
                        ({ coords }) => {
                            tempCoords = [coords.longitude, coords.latitude];
                            MainStore.setGpsLocation(tempCoords);
                        },
                        (err) => console.error("Geo error:", err),
                    );

                    if (tempCoords === null) {
                        throw new Error("User Location missing");
                    }
                } catch (err) {
                    GeolocationRef.current.on("change:position", function () {
                        const coordinates =
                            GeolocationRef.current.getPosition();
                        if (coordinates) {
                            MainStore.setGpsLocation(coordinates);

                            positionFeature.setGeometry(new Point(coordinates));
                        }
                    });
                }
            }
            // Animate to new position with smooth pan
            const view = mapRef.current.getView();

            if (tempCoords === null) {
                toast("Getting GPS !");
                return;
            }

            // First pan to location
            view.animate({
                center: tempCoords,
                duration: 1000,
                easing: easeOut,
            });

            // Then zoom in to level 17 with animation
            view.animate({
                zoom: 17,
                duration: 1200,
                easing: easeOut,
            });

            positionFeature.setGeometry(new Point(tempCoords));

            // Create GPS layer
            let gpsLayer = new VectorLayer({
                map: mapRef.current,
                source: new VectorSource({
                    features: [positionFeature],
                }),
                zIndex: 99, // Ensure it's on top
            });

            GpsLayerRef.current = gpsLayer

            // Store cleanup references
            return () => {
                GeolocationRef.current.setTracking(false);
                mapRef.current.removeLayer(gpsLayer);
                PositionFeatureRef.current = null;
            };
        }

        // Handle GPS button click to center on current location
        if (
            PositionFeatureRef.current !== null &&
            MainStore.gpsLocation !== null &&
            MainStore.isGPSClick
        ) {
            const view = mapRef.current.getView();

            if(MainStore.gpsLocation === null){
                toast.error("Not able to get Location !");
                return;
            }

            // Sequence of animations for smoother experience
            // 1. First start panning
            view.animate({
                center: MainStore.gpsLocation,
                duration: 800,
                easing: easeOut,
            });

            // 2. Then always animate to zoom level 17 regardless of current zoom
            view.animate({
                zoom: 17,
                duration: 1000,
                easing: easeOut,
            });
        }
    }, [MainStore.isGPSClick]);

    useEffect(() => {
        if (!mapRef.current) {
            initializeMap();
        }

        if (districtName && blockName && AdminLayerRef.current === null) {
            const view = mapRef.current.getView();
            view.cancelAnimations();
            fetchBoundaryAndZoom(districtName, blockName);
        }
    }, [blockName, districtName]);

    // Handle map mode changes
    useEffect(() => {
        if (!mapRef.current) return;

        if (isMapEditable) {
            // Reset to editable mode - restore boundary and allow interactions
            if (districtName && blockName) {
                // Re-fetch boundary if it was removed
                if (!AdminLayerRef.current) {
                    fetchBoundaryAndZoom(districtName, blockName);
                }

                // Clear any accepted item markers
                if (AcceptedItemLayerRef.current) {
                    mapRef.current.removeLayer(AcceptedItemLayerRef.current);
                    AcceptedItemLayerRef.current = null;
                }

                // Reset marker placement
                if (MapMarkerRef.current) {
                    MapMarkerRef.current.setVisible(false);
                }
            }
        } else {
            // Non-editable mode - ensure boundary is removed and accepted item is visible
            console.log('🔄 MapComponent - Entering non-editable mode');

            // Remove boundary layer if it exists
            if (AdminLayerRef.current) {
                mapRef.current.removeLayer(AdminLayerRef.current);
                AdminLayerRef.current = null;
            }

            // Ensure accepted item layer is visible
            if (AcceptedItemLayerRef.current && !mapRef.current.getLayers().getArray().includes(AcceptedItemLayerRef.current)) {
                mapRef.current.addLayer(AcceptedItemLayerRef.current);
            }
        }
    }, [isMapEditable, districtName, blockName, acceptedWorkDemandItem]);

    // When a Work Demand is accepted and we navigated from dialog, focus on it once
    useEffect(() => {
        if (!mapRef.current) return;
        if (!acceptedWorkDemandItem || !acceptedFromDialog) return;

        // ⚠️ CRITICAL FIX: Don't run this effect if user has explicitly enabled editing
        if (MainStore.userExplicitlyEnabledEditing) {
            console.log('🔄 MapComponent - Skipping focus effect - user explicitly enabled editing');
            return;
        }

        console.log('🎯 MapComponent - Focusing on accepted work demand item');

        // Focus on the accepted item
        if (MainStore.acceptedWorkDemandCoords) {
            const view = mapRef.current.getView();
            view.cancelAnimations();
            view.animate({
                center: MainStore.acceptedWorkDemandCoords,
                zoom: 16,
                duration: 1000,
                easing: easeOut
            });
        }

        // Clear the dialog flag after focusing
        clearAcceptedFromDialog();
    }, [acceptedWorkDemandItem, acceptedFromDialog]);

    // 🎯 NEW: Initialize layers when a plan is selected
    useEffect(() => {
        if (!mapRef.current || !currentPlan || !districtName || !blockName) return;
        
        console.log('🎯 MapComponent - Plan selected, initializing layers:', {
            plan: currentPlan?.plan,
            districtName,
            blockName,
            isMapEditable
        });

        // Only initialize layers if we're in editable mode (normal flow) or if we have an accepted work demand item
        if (isMapEditable || acceptedWorkDemandItem) {
            initializeLayersForPlan();
        }
    }, [currentPlan, districtName, blockName, isMapEditable, acceptedWorkDemandItem]);

    // 🎯 NEW: Create accepted work demand item marker immediately when detected
    useEffect(() => {

        if (!mapRef.current || !acceptedWorkDemandItem || !MainStore.acceptedWorkDemandCoords) {
            return;
        }

        // Don't create if already exists
        if (AcceptedItemLayerRef.current) {
            console.log('🔍 Marker already exists, skipping creation');
            return;
        }

        try {
            // Create a feature for the accepted item
            const acceptedItemFeature = new Feature();

            // Style the accepted item marker (exact same as normal flow)
            const acceptedItemStyle = new Style({
                image: new Icon({
                    anchor: [0.5, 46],
                    anchorXUnits: "fraction",
                    anchorYUnits: "pixels",
                    src: itemMarker,
                }),
            });

            // Create the layer for the accepted item
            const acceptedItemLayer = new VectorLayer({
                map: mapRef.current,
                source: new VectorSource({
                    features: [acceptedItemFeature],
                }),
                style: acceptedItemStyle,
            });
            acceptedItemFeature.setGeometry(new Point(MainStore.acceptedWorkDemandCoords));

            // Store reference and add to map
            AcceptedItemLayerRef.current = acceptedItemLayer;
            
            MainStore.setMarkerPlaced(true);

            console.log('✅ Accepted work demand item marker created and displayed immediately');
        } catch (error) {
            console.error('❌ Error creating accepted work demand item marker:', error);
        }
    }, [acceptedWorkDemandItem, MainStore.acceptedWorkDemandCoords]);

    // 🎯 NEW: Automatically set map to non-editable mode when accepted work demand item is detected
    useEffect(() => {
        if (acceptedWorkDemandItem && MainStore.acceptedWorkDemandCoords && isMapEditable) {
            console.log('🎯 MapComponent - Detected accepted work demand item, setting map to non-editable mode');
            setIsMapEditable(false);
        }
    }, [acceptedWorkDemandItem, MainStore.acceptedWorkDemandCoords, isMapEditable]);

    // 🎯 NEW: Function to initialize layers for the selected plan
    const initializeLayersForPlan = async () => {
        if (!mapRef.current || !currentPlan || !districtName || !blockName) return;

        try {
            // Initialize layers that are needed for the map to function properly
            // Some layers are loaded but not necessarily displayed by default

            // Initialize Well Depth layer - needed for map functionality (matches normal flow)
            if (groundwaterRefs[0].current === null) {
                const wellDepthLayer = await getVectorLayers(
                    "mws_layers",
                    `deltaG_well_depth_${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                    true,
                    true
                );
                groundwaterRefs[0].current = wellDepthLayer;
                // Don't add to map by default - only when user clicks the layer button
                console.log('✅ Well Depth layer initialized (background layer)');
                
                // 🎯 NEW: If we have an accepted work demand item marker, highlight the subregion containing it
                if (acceptedWorkDemandItem && MainStore.acceptedWorkDemandCoords) {
                    console.log('🎯 Well Depth layer ready, highlighting subregion for existing marker');
                    
                    // 🎯 NEW: Set Well Depth layer z-index lower than marker
                    groundwaterRefs[0].current.setZIndex(100); // Lower than marker's 1000
                    
                    // Add a longer delay to ensure the layer features are fully loaded
                    setTimeout(() => {
                        highlightWellDepthSubregionForMarker(MainStore.acceptedWorkDemandCoords);
                    }, 2000); // Increased from 500ms to 2000ms
                }
            }

            // Initialize Settlement layer - only if it doesn't exist (matches normal flow)
            if (assetsLayerRefs[0].current === null) {
                const settlementLayer = await getVectorLayers(
                    "resources",
                    `settlement_${currentPlan.plan_id}_${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                    true,
                    true
                );
                assetsLayerRefs[0].current = settlementLayer;
                mapRef.current.addLayer(settlementLayer);
                console.log('✅ Settlement layer initialized');
            }

            // Initialize Well layer - only if it doesn't exist (matches normal flow)
            if (assetsLayerRefs[1].current === null) {
                const wellLayer = await getVectorLayers(
                    "resources",
                    `well_${currentPlan.plan_id}_${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                    true,
                    true
                );
                assetsLayerRefs[1].current = wellLayer;
                mapRef.current.addLayer(wellLayer);
                console.log('✅ Well layer initialized');
            }

            // Initialize Water Structure layer - only if it doesn't exist (matches normal flow)
            if (assetsLayerRefs[2].current === null) {
                const waterStructureLayer = await getVectorLayers(
                    "resources",
                    `waterbody_${currentPlan.plan_id}_${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                    true,
                    true
                );
                assetsLayerRefs[2].current = waterStructureLayer;
                mapRef.current.addLayer(waterStructureLayer);
                console.log('✅ Water Structure layer initialized');
            }

            // Set layer store states to match what's actually shown (matches normal flow)
            LayersStore.setAdminBoundary(true);
            LayersStore.setWellDepth(true); // Available but not shown by default
            LayersStore.setSettlementLayer(true);
            LayersStore.setWellLayer(true);
            LayersStore.setWaterStructure(true);
            // Note: WorkGroundwater, Drainage, etc. are not shown by default

            // 🎯 NEW: Marker creation is handled in useEffect hook - no need to create here
            console.log('⏰ Marker creation handled separately in useEffect hook');
        } catch (error) {
            console.error('❌ Error initializing layers for plan:', error);
        }
    };

    // Clear the dialog flag after a short delay to ensure map mode is set
    useEffect(() => {
        if (acceptedFromDialog && !isMapEditable) {
            const timer = setTimeout(() => {
                console.log('📍 MapComponent - Clearing acceptedFromDialog flag');
                clearAcceptedFromDialog();
            }, 1000); // Wait 1 second for map mode to be set

            return () => clearTimeout(timer);
        }
    }, [acceptedFromDialog, isMapEditable]);

    // Clean up accepted item marker when accepted item changes or component unmounts
    useEffect(() => {
        return () => {
            if (AcceptedItemLayerRef.current && mapRef.current) {
                mapRef.current.removeLayer(AcceptedItemLayerRef.current);
                AcceptedItemLayerRef.current = null;
            }
            // ⭐ FIXED: Don't clear coordinates on every cleanup, only on unmount
            // clearAcceptedWorkDemandCoords(); // REMOVED - was clearing coordinates too aggressively
        };
    }, []); // Empty dependency array - only runs on unmount

    // ⭐ FIXED: Only clear coordinates when accepted item is completely cleared (not during normal operation)
    useEffect(() => {
        if (!acceptedWorkDemandItem && !MainStore.acceptedWorkDemandCoords) {
            // Only clear if both the item and coordinates are gone
            clearAcceptedWorkDemandCoords();
        }
    }, [acceptedWorkDemandItem, MainStore.acceptedWorkDemandCoords]);

    // Debug effect to track state changes
    useEffect(() => {
        if(currentPlan !== null){
            fetchResourcesLayers()
        }
    },[currentPlan])

    useEffect(() => {
        if (!mapRef.current) return;

        if (isMapEditable) {
            // Reset to editable mode - restore boundary and allow interactions
            if (districtName && blockName) {
                // Re-fetch boundary if it was removed
                if (!AdminLayerRef.current) {
                    fetchBoundaryAndZoom(districtName, blockName);
                }

                // Clear any accepted item markers
                if (AcceptedItemLayerRef.current) {
                    mapRef.current.removeLayer(AcceptedItemLayerRef.current);
                    AcceptedItemLayerRef.current = null;
                }

                // Reset marker placement
                if (MapMarkerRef.current) {
                    MapMarkerRef.current.setVisible(false);
                }
            }
        } else {
            // Non-editable mode - ensure boundary is removed and accepted item is visible
            console.log('🔄 MapComponent - Entering non-editable mode');

            // Remove boundary layer if it exists
            if (AdminLayerRef.current) {
                mapRef.current.removeLayer(AdminLayerRef.current);
                AdminLayerRef.current = null;
            }

            // Ensure accepted item layer is visible
            if (AcceptedItemLayerRef.current && !mapRef.current.getLayers().getArray().includes(AcceptedItemLayerRef.current)) {
                mapRef.current.addLayer(AcceptedItemLayerRef.current);
            }
        }
    }, [isMapEditable, districtName, blockName, acceptedWorkDemandItem]);


    useEffect(() => {
        if (currentPlan !== null) {
            fetchResourcesLayers();
        }
    }, [currentPlan]);

    useEffect(() => {
        updateLayersOnStep();
    }, [currentStep]);

    useEffect(() => {
        updateLayersOnScreen();
    }, [currentScreen]);

    useEffect(() => {
        updateLulcLayer();
    }, [MainStore.lulcYearIdx]);

    useEffect(() => {
        async function applyNregaStyle() {
            if (NregaWorkLayerRef.current !== null) {
                const nregaVectorSource =
                    await NregaWorkLayerRef.current.getSource();
                mapRef.current.removeLayer(NregaWorkLayerRef.current);

                let nregaWebGlLayer = new WebGLVectorLayer({
                    source: nregaVectorSource,
                    style: MainStore.nregaStyle,
                });

                NregaWorkLayerRef.current = nregaWebGlLayer;
                mapRef.current.addLayer(nregaWebGlLayer);
            }
        }

        applyNregaStyle();
    }, [MainStore.nregaStyle]);

    useEffect(() => {
        if (MainStore.isSubmissionSuccess) {
            refreshResourceLayers();
            MainStore.setIsSubmissionSuccess(false);
        }
    }, [MainStore.isSubmissionSuccess]);

    useEffect(() => {
        if (groundwaterRefs[0].current !== null) {
            groundwaterRefs[0].current.setStyle(function (feature) {
                const status = feature.values_;
                let tempColor;

                if (MainStore.selectWellDepthYear === "2018_23") {
                    if (status.Net2018_23 < -5) {
                        tempColor = "rgba(255, 0, 0, 0.5)";
                    } else if (
                        status.Net2018_23 >= -5 &&
                        status.Net2018_23 < -1
                    ) {
                        tempColor = "rgba(255, 255, 0, 0.5)";
                    } else if (
                        status.Net2018_23 >= -1 &&
                        status.Net2018_23 <= 1
                    ) {
                        tempColor = "rgba(0, 255, 0, 0.5)";
                    } else {
                        tempColor = "rgba(0, 0, 255, 0.5)";
                    }

                    return new Style({
                        stroke: new Stroke({
                            color: "#1AA7EC",
                            width: 1,
                        }),
                        fill: new Fill({
                            color: tempColor,
                        }),
                    });
                } else {
                    if (status.Net2017_22 < -5) {
                        tempColor = "rgba(255, 0, 0, 0.5)";
                    } else if (
                        status.Net2017_22 >= -5 &&
                        status.Net2017_22 < -1
                    ) {
                        tempColor = "rgba(255, 255, 0, 0.5)";
                    } else if (
                        status.Net2017_22 >= -1 &&
                        status.Net2017_22 <= 1
                    ) {
                        tempColor = "rgba(0, 255, 0, 0.5)";
                    } else {
                        tempColor = "rgba(0, 0, 255, 0.5)";
                    }

                    return new Style({
                        stroke: new Stroke({
                            color: "#1AA7EC",
                            width: 1,
                        }),
                        fill: new Fill({
                            color: tempColor,
                        }),
                    });
                }
            });
        }
    }, [MainStore.selectWellDepthYear]);

    useEffect(() => {
        const layerCollection = mapRef.current.getLayers();

        if (MainStore.layerClicked !== null) {
            if (MainStore.layerClicked === "AdminBoundary") {
                if (
                    LayersStore[MainStore.layerClicked] &&
                    !layerCollection
                        .getArray()
                        .some((layer) => layer === AdminLayerRef.current)
                ) {
                    mapRef.current.addLayer(AdminLayerRef.current);
                } else {
                    mapRef.current.removeLayer(AdminLayerRef.current);
                }
            } else if (MainStore.layerClicked === "NregaLayer") {
                if (
                    LayersStore[MainStore.layerClicked] &&
                    !layerCollection
                        .getArray()
                        .some((layer) => layer === NregaWorkLayerRef.current)
                ) {
                    mapRef.current.addLayer(NregaWorkLayerRef.current);
                } else {
                    mapRef.current.removeLayer(NregaWorkLayerRef.current);
                }
            }
                else if(MainStore.layerClicked === "WellDepth"){
                    if(LayersStore[MainStore.layerClicked] && !layerCollection.getArray().some(layer => layer === groundwaterRefs[0].current)){
                        mapRef.current.addLayer(groundwaterRefs[0].current);
                        
                        // 🎯 NEW: Set Well Depth layer z-index lower than marker
                        groundwaterRefs[0].current.setZIndex(100); // Lower than marker's 1000
                        
                        // 🎯 NEW: If we have an accepted work demand item marker, highlight the subregion containing it
                        if (acceptedWorkDemandItem && MainStore.acceptedWorkDemandCoords) {
                            console.log('🎯 Well Depth layer added to map, highlighting subregion for existing marker');
                            // Add a longer delay to ensure the layer features are fully rendered
                            setTimeout(() => {
                                highlightWellDepthSubregionForMarker(MainStore.acceptedWorkDemandCoords);
                            }, 2000); // Increased from 500ms to 2000ms
                        }
                    }
                    else{mapRef.current.removeLayer(groundwaterRefs[0].current)}
                }
            } else if (MainStore.layerClicked === "DrainageLayer") {
                if (
                    LayersStore[MainStore.layerClicked] &&
                    !layerCollection
                        .getArray()
                        .some((layer) => layer === groundwaterRefs[1].current)
                ) {
                    mapRef.current.addLayer(groundwaterRefs[1].current);
                } else {
                    mapRef.current.removeLayer(groundwaterRefs[1].current);
                }
            } else if (MainStore.layerClicked === "SettlementLayer") {
                if (
                    LayersStore[MainStore.layerClicked] &&
                    !layerCollection
                        .getArray()
                        .some((layer) => layer === assetsLayerRefs[0].current)
                ) {
                    mapRef.current.addLayer(assetsLayerRefs[0].current);
                } else {
                    mapRef.current.removeLayer(assetsLayerRefs[0].current);
                }
            } else if (MainStore.layerClicked === "WellLayer") {
                if (
                    LayersStore[MainStore.layerClicked] &&
                    !layerCollection
                        .getArray()
                        .some((layer) => layer === assetsLayerRefs[1].current)
                ) {
                    mapRef.current.addLayer(assetsLayerRefs[1].current);
                } else {
                    mapRef.current.removeLayer(assetsLayerRefs[1].current);
                }
            } else if (MainStore.layerClicked === "WaterStructure") {
                if (
                    LayersStore[MainStore.layerClicked] &&
                    !layerCollection
                        .getArray()
                        .some((layer) => layer === assetsLayerRefs[2].current)
                ) {
                    mapRef.current.addLayer(assetsLayerRefs[2].current);
                } else {
                    mapRef.current.removeLayer(assetsLayerRefs[2].current);
                }
            } else if (MainStore.layerClicked === "WorkAgri") {
                if (
                    LayersStore[MainStore.layerClicked] &&
                    !layerCollection
                        .getArray()
                        .some((layer) => layer === AgriLayersRefs[2].current)
                ) {
                    mapRef.current.addLayer(AgriLayersRefs[2].current);
                } else {
                    mapRef.current.removeLayer(AgriLayersRefs[2].current);
                }
            } else if (MainStore.layerClicked === "WorkGroundwater") {
                if (
                    LayersStore[MainStore.layerClicked] &&
                    !layerCollection
                        .getArray()
                        .some((layer) => layer === groundwaterRefs[3].current)
                ) {
                    mapRef.current.addLayer(groundwaterRefs[3].current);
                } else {
                    mapRef.current.removeLayer(groundwaterRefs[3].current);
                }
            } else if (MainStore.layerClicked === "Livelihood") {
                if (
                    LayersStore[MainStore.layerClicked] &&
                    !layerCollection
                        .getArray()
                        .some((layer) => layer === LivelihoodRefs[0].current)
                ) {
                    mapRef.current.addLayer(LivelihoodRefs[0].current);
                } else {
                    mapRef.current.removeLayer(LivelihoodRefs[0].current);
                }

            }else if(MainStore.layerClicked === "CLARTLayer"){
                    if(LayersStore[MainStore.layerClicked] && !layerCollection.getArray().some(layer => layer === ClartLayerRef.current)){mapRef.current.addLayer(ClartLayerRef.current)}
                    else{mapRef.current.removeLayer(ClartLayerRef.current)}
            }
    },[LayersStore])

    // 🎯 NEW: Function to highlight the Well Depth subregion containing the accepted work demand item marker
    const highlightWellDepthSubregionForMarker = (markerCoords) => {
        
        if (!groundwaterRefs[0].current) {
            console.log('❌ Well Depth layer not loaded yet');
            return;
        }
        
        if (!markerCoords) {
            console.log('❌ No marker coordinates provided');
            return;
        }
        
        console.log('🎯 Highlighting Well Depth subregion for marker at:', markerCoords);
        console.log('🔍 Well Depth layer ref:', groundwaterRefs[0].current);
        console.log('🔍 Well Depth layer visible:', groundwaterRefs[0].current.getVisible());
        
        try {
            const wellDepthSource = groundwaterRefs[0].current.getSource();
            console.log('🔍 Well Depth source:', wellDepthSource);
            
            // 🎯 NEW: Wait for features to load if they're not ready yet
            const features = wellDepthSource.getFeatures();
            
            if (features.length === 0) {
                console.log('⏰ No features loaded yet, waiting for source to be ready...');
                
                // Wait for the source to be ready
                const waitForFeatures = () => {
                    const currentFeatures = wellDepthSource.getFeatures();
                    console.log('🔄 Checking features again, count:', currentFeatures.length);
                    
                    if (currentFeatures.length > 0) {
                        console.log('✅ Features loaded, proceeding with highlighting');
                        highlightWellDepthSubregionForMarker(markerCoords); // Recursive call
                    } else {
                        // Still no features, wait a bit more
                        setTimeout(waitForFeatures, 500);
                    }
                };
                
                setTimeout(waitForFeatures, 500);
                return;
            }
            
            // Find which subregion contains the marker coordinates
            let containingFeature = null;
            for (let i = 0; i < features.length; i++) {
                const feature = features[i];
                const geometry = feature.getGeometry();
                console.log(`🔍 Feature ${i}:`, {
                    uid: feature.get("uid"),
                    hasGeometry: !!geometry,
                    geometryType: geometry ? geometry.getType() : 'none'
                });
                
                if (geometry && geometry.intersectsCoordinate(markerCoords)) {
                    containingFeature = feature;
                    console.log(`✅ Found containing feature at index ${i}`);
                    break;
                }
            }
            
            if (containingFeature) {
                const clickedMwsId = containingFeature.get("uid");
                console.log('✅ Found containing subregion with UID:', clickedMwsId);
                
                // 🎯 NEW: Try to find adjacent subregions to highlight (matching normal flow behavior)
                const adjacentFeatures = [];
                for (let i = 0; i < features.length; i++) {
                    const feature = features[i];
                    const geometry = feature.getGeometry();
                    
                    if (geometry && feature.get("uid") !== clickedMwsId) {
                        // Check if this feature is adjacent to the containing feature
                        // For now, we'll highlight features that are close to the marker
                        const featureCenter = geometry.getInteriorPoint ? geometry.getInteriorPoint() : geometry.getExtent();
                        if (featureCenter) {
                            const distance = Math.sqrt(
                                Math.pow(featureCenter[0] - markerCoords[0], 2) + 
                                Math.pow(featureCenter[1] - markerCoords[1], 2)
                            );
                            // If feature is within a certain distance, consider it adjacent
                            if (distance < 0.01) { // Adjust this threshold as needed
                                adjacentFeatures.push(feature.get("uid"));
                                console.log(`🎯 Found adjacent subregion: ${feature.get("uid")} at distance: ${distance}`);
                            }
                        }
                    }
                }
                
                // Apply the same styling logic as normal flow
                console.log('🎨 Applying styling to Well Depth layer...');
                groundwaterRefs[0].current.setStyle((feature) => {
                    const featureUid = feature.get("uid");
                    console.log(`🎨 Styling feature with UID: ${featureUid}, target UID: ${clickedMwsId}`);
                    
                    // 🎯 NEW: Skip styling if this is a marker feature (not a subregion)
                    if (!featureUid) {
                        console.log(`🎨 Skipping marker feature - no UID`);
                        return null; // Use default styling for marker features
                    }
                    
                    if (featureUid === clickedMwsId || adjacentFeatures.includes(featureUid)) {
                        // Turn the containing subregion and adjacent subregions white with transparency - matching normal flow
                        return new Style({
                            stroke: new Stroke({
                                color: "#1AA7EC",
                                width: 1,
                            }),
                            fill: new Fill({
                                color: "rgba(255, 255, 255, 0.1)", // White with transparency - exact match to normal flow
                            })
                        });
                    } else {
                        // Keep other subregions with original thematic colors
                        const status = feature.values_;
                        let tempColor;
                        
                        if (MainStore.selectWellDepthYear === '2018_23') {
                            if (status.Net2018_23 < -5) tempColor = "rgba(255, 0, 0, 0.5)";
                            else if (status.Net2018_23 >= -5 && status.Net2018_23 < -1) tempColor = "rgba(255, 255, 0, 0.5)";
                            else if (status.Net2018_23 >= -1 && status.Net2018_23 <= 1) tempColor = "rgba(0, 255, 0, 0.5)";
                            else tempColor = "rgba(0, 0, 255, 0.5)";
                        } else {
                            if (status.Net2017_22 < -5) tempColor = "rgba(255, 0, 0, 0.5)";
                            else if (status.Net2017_22 >= -5 && status.Net2017_22 < -1) tempColor = "rgba(255, 255, 0, 0.5)";
                            else if (status.Net2017_22 >= -1 && status.Net2017_22 <= 1) tempColor = "rgba(0, 255, 0, 0.5)";
                            else tempColor = "rgba(0, 0, 255, 0.5)";
                        }
                        
                        console.log(`🎨 Keeping feature ${featureUid} with color: ${tempColor}`);
                        return new Style({
                            stroke: new Stroke({
                                color: "#1AA7EC",
                                width: 1,
                            }),
                            fill: new Fill({
                                color: tempColor,
                            })
                        });
                    }
                });
                
                console.log('✅ Well Depth subregion highlighting applied successfully');
            } else {
                console.log('⚠️ No Well Depth subregion found containing the marker coordinates');
                console.log('🔍 Marker coordinates:', markerCoords);
                console.log('🔍 Available features:', features);
            }
        } catch (error) {
            console.error('❌ Error highlighting Well Depth subregion:', error);
        }
    };


    return (
        <div className="relative h-full w-full">
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-sm">
                    <SquircleLoader
                        size={48}
                        strokeWidth={4}
                        color="#2563eb"
                        backgroundColor="rgba(255, 255, 255, 0.3)"
                        speed={1500}
                    />
                </div>
            )}

            {/* Non-editable mode banner */}
            {!isMapEditable && acceptedWorkDemandItem && (
                <div className="absolute top-0 left-0 right-0 z-40 bg-blue-600 text-white px-4 py-1 text-center">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-center space-x-3">
                            <span className="font-medium text-xs">
                                Processing Accepted Asset Demand
                            </span>
                            <button
                                onClick={() => {

                                    // Reset all work demand related variables when enabling editing
                                    clearAcceptedWorkDemandItem();
                                    clearAcceptedFromDialog();
                                    clearAcceptedWorkDemandCoords();
                                    setMarkerPlaced(false);
                                    setMarkerCoords(null);

                                    // Clear the flag first, then set map to editable
                                    clearUserExplicitlyEnabledEditing();
                                    setIsMapEditable(true);

                                    // 🎯 NEW: Clear community state when Enable Editing is clicked
                                    MainStore.clearAcceptedWorkDemandCommunityInfo();
                                    console.log("🔧 Enable Editing - Community state cleared");

                                    // Set the flag after a short delay to ensure state is updated
                                    setTimeout(() => {
                                        setUserExplicitlyEnabledEditing(true);
                                        console.log("🔧 Enable Editing - Flag set after delay");
                                    }, 50);

                                    // Force a re-render to ensure state changes take effect
                                    setTimeout(() => {
                                        console.log("🔧 Enable Editing - State after timeout:", {
                                            isMapEditable: MainStore.isMapEditable,
                                            userExplicitlyEnabledEditing: MainStore.userExplicitlyEnabledEditing
                                        });
                                    }, 100);

                                }}
                                className="px-3 py-1 bg-white text-blue-600 rounded text-xs hover:bg-gray-100 transition-colors font-medium"
                            >
                                Exit
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="h-full w-full" ref={mapElement} />
        </div>
    );
};

export default MapComponent;
