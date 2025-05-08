import { useEffect, useRef, useState } from "react";
import useMainStore from "../store/MainStore.jsx";
import getWebglVectorLayers from '../action/getWebglVectorLayers.js';
import getVectorLayers from "../action/getVectorLayers.js";
import getWebGlLayers from "../action/getWebglLayers.js";
import getImageLayer from "../action/getImageLayer.js";

//* OpenLayers imports
import "ol/ol.css";
import XYZ from "ol/source/XYZ";
import TileLayer from "ol/layer/Tile";
import Control from 'ol/control/Control.js';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import { Map, View, Feature } from "ol";
import {Stroke, Fill, Style, Icon } from "ol/style.js";
import VectorLayer from "ol/layer/Vector.js";
import Point from "ol/geom/Point.js";
import Select from "ol/interaction/Select.js";
import WebGLPointsLayer from 'ol/layer/WebGLPoints.js';
import VectorSource from "ol/source/Vector.js";

import settlementIcon from "../assets/settlement_icon.svg"
import LargeWaterBody from "../assets/waterbodiesScreenIcon.svg"
import selectedSettlementIcon from "../assets/selected_settlement.svg"
import iconsDetails from "../assets/icons.json"
import mapMarker from "../assets/map_marker.svg"

const MapComponent = () => {
    const mapElement = useRef(null);
    const mapRef = useRef(null);
    const baseLayerRef = useRef(null);
    const AdminLayerRef = useRef(null);
    const MapMarkerRef = useRef(null)
    const NregaWorkLayerRef = useRef(null);
    const ClartLayerRef = useRef(null)
    const WaterbodiesLayerRef = useRef(null)
    
    const tempSettlementFeature = useRef(null)
    const tempSettlementLayer = useRef(null)

    const [isLoading, setIsLoading] = useState(false);

    const MainStore = useMainStore((state) => state);

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

    //?                  deltag WellDepth   drainage    fortnight
    let groundwaterRefs = [useRef(null), useRef(null), useRef(null)]

    //?                     17-18       18-19           19-20       20-21           21-22       22-23           23-24
    let LulcLayerRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)]
    
    //?                   Drought       Cropping Inten
    let AgriLayersRefs = [useRef(null), useRef(null)]
    let LulcYears = {
        0 : "17_18",
        1 : "18_19",
        2 : "19_20",
        3 : "20_21",
        4 : "21_22",
        5 : "22_23",
        6 : "23_24"
    }


    const initializeMap = async () => {
        const baseLayer = new TileLayer({
            source: new XYZ({
                url: `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}`,
                maxZoom: 30,
                transition: 500,
            }),
            preload: 4,
        });

        baseLayerRef.current = baseLayer

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

        const map = new Map({
            target: mapElement.current,
            layers: [baseLayer],
            controls: defaultControls().extend([new GoogleLogoControl()]),
            view,
            loadTilesWhileAnimating: true,
            loadTilesWhileInteracting: true,
        });

        mapRef.current = map;
    };

    const fetchBoundaryAndZoom = async (district, block) => {
        setIsLoading(true);
        try {
            const boundaryLayer = await getWebglVectorLayers(
                "panchayat_boundaries",
                `${district.toLowerCase().replace(/\s+/g, "_")}_${block.toLowerCase().replace(/\s+/g, "_")}`,
                true,
                true
            );

            const nregaWorksLayer = await getWebGlLayers(
                "nrega_assets",
                `${district.toLowerCase().replace(/\s+/g, "_")}_${block.toLowerCase().replace(/\s+/g, "_")}`,
                setAllNregaYears,
                MainStore.nregaStyle
            )

            boundaryLayer.setOpacity(0);
            nregaWorksLayer.setOpacity(0);

            mapRef.current.addLayer(boundaryLayer);
            mapRef.current.addLayer(nregaWorksLayer);

            AdminLayerRef.current = boundaryLayer
            NregaWorkLayerRef.current = nregaWorksLayer

            const vectorSource = boundaryLayer.getSource();

            await new Promise((resolve, reject) => {
                const checkFeatures = () => {
                    if (vectorSource.getFeatures().length > 0) {
                        resolve();
                    } else {
                        vectorSource.once('featuresloadend', () => {
                            vectorSource.getFeatures().length > 0 ? resolve() : reject(new Error('No features loaded'));
                        });
                        setTimeout(() => {
                            vectorSource.getFeatures().length > 0 ? resolve() : reject(new Error('Timeout loading features'));
                        }, 10000);
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
                    }
                });
            });

            mapRef.current.on("click", (e) => {
                MainStore.setIsMetadata(false)
                MainStore.setIsWaterBody(false)
                MainStore.setIsGroundWater(false)
                const NregaFeature = mapRef.current.forEachFeatureAtPixel(
                    e.pixel,
                    (feature, layer) => {
                      if (layer === NregaWorkLayerRef.current) {
                        return feature;
                      }
                    }
                );

                const deltaGFeature = mapRef.current.forEachFeatureAtPixel(
                    e.pixel,
                    (feature, layer) => {
                      if (layer === groundwaterRefs[0].current) {
                        return feature;
                      }
                    }
                );

                const croppingFeature = mapRef.current.forEachFeatureAtPixel(
                    e.pixel,
                    (feature, layer) => {
                      if (layer === AgriLayersRefs[0].current) {
                        return feature;
                      }
                    }
                );

                const waterBodyFeature = mapRef.current.forEachFeatureAtPixel(
                    e.pixel,
                    (feature, layer) => {
                      if (layer === WaterbodiesLayerRef.current) {
                        return feature;
                      }
                    }
                );

                const fortnightFeature = mapRef.current.forEachFeatureAtPixel(
                    e.pixel,
                    (feature, layer) => {
                      if (layer === groundwaterRefs[2].current) {
                        return feature;
                      }
                    }
                );

                if(NregaFeature){
                    MainStore.setIsMetadata(true)
                    MainStore.setMetadata(NregaFeature.values_)
                    MainStore.setIsOpen(true)
                }

                if(deltaGFeature !== undefined){
                    setSelectedResource(deltaGFeature.values_)
                    MainStore.setIsGroundWater(true)
                    console.log(deltaGFeature.values_)
                    const clickedMwsId = deltaGFeature.get("uid");
                    groundwaterRefs[0].current.setStyle((feature) => {
                        if(feature.values_.uid === clickedMwsId){
                            return new Style({
                                stroke: new Stroke({
                                    color: "#1AA7EC",
                                    width: 1,
                                }),
                                fill: new Fill({
                                    color: "rgba(255, 0, 0, 0.0)",
                                })
                            });
                        }
                        else{
                            const status = feature.values_;
                            let tempColor

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
                                })
                            });
                        }
                    });
                }

                if(fortnightFeature !== undefined){
                    console.log(fortnightFeature.values_)
                    MainStore.setFortnightData(fortnightFeature.values_)
                }

                if(croppingFeature !== undefined){
                    croppingFeature.setStyle(new Style({
                        fill: new Fill({
                          color: "rgba(0, 0, 0, 0.9)",
                        }),
                        stroke: new Stroke({
                          color: "#1AA7EC",
                          width: 1,
                        }),
                      })
                    )
                }

                if(waterBodyFeature !== undefined){
                    setSelectedResource(waterBodyFeature.values_)
                    MainStore.setIsWaterBody(true)
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

    const fetchResourcesLayers = async() =>{
        setIsLoading(true);

        const settlementLayer = await getVectorLayers(
            "resources",
            "settlement_"+ currentPlan.plan_id + '_' +`${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
            true,
            true
        );

        const wellLayer = await getVectorLayers(
            "resources",
            "well_"+ currentPlan.plan_id + '_' +`${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
            true,
            true
        )

        const waterStructureLayer = await getVectorLayers(
            "resources",
            "waterbody_"+ currentPlan.plan_id + '_' +`${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
            true,
            true
        )

        const cropGridLayer = await getVectorLayers(
            "crop_grid_layers",
            `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}` + "_grid",
            true,
            true
        )

        settlementLayer.setStyle(
            new Style({
              image: new Icon({ src: settlementIcon, scale: 0.4 }),
            })
        );

        wellLayer.setStyle(function (feature) {
            const status = feature.values_;
            if(status.status_re in iconsDetails.socialMapping_icons.well){
                return new Style({
                    image: new Icon({ src: iconsDetails.socialMapping_icons.well[status.status_re] }),
                })
            }
            else{
                return new Style({
                    image: new Icon({ src: iconsDetails.socialMapping_icons.well["proposed"] }),
                })
            }
        });

        waterStructureLayer.setStyle(function (feature) {
            const status = feature.values_;
            if(status.status_re in iconsDetails.WB_Icons){
                return new Style({
                    image: new Icon({ src: iconsDetails.WB_Icons[status.wbs_type] }),
                })
            }
            else{
                return new Style({
                    image: new Icon({ src: LargeWaterBody }),
                })
            }
        });


        if(assetsLayerRefs[0].current !== null){mapRef.current.removeLayer(assetsLayerRefs[0].current)}
        if(assetsLayerRefs[1].current !== null){mapRef.current.removeLayer(assetsLayerRefs[1].current)}
        if(assetsLayerRefs[2].current !== null){mapRef.current.removeLayer(assetsLayerRefs[2].current)}

        assetsLayerRefs[0].current = settlementLayer
        assetsLayerRefs[1].current = wellLayer
        assetsLayerRefs[2].current = waterStructureLayer
        assetsLayerRefs[3].current = cropGridLayer

        mapRef.current.addLayer(assetsLayerRefs[0].current)
        mapRef.current.addLayer(assetsLayerRefs[1].current)
        mapRef.current.addLayer(assetsLayerRefs[2].current)


        //? Adding Marker to the Map on Click
        const markerFeature = new Feature()
        const iconStyle = new Style({
            image: new Icon({
                anchor: [0.5, 46],
                anchorXUnits: "fraction",
                anchorYUnits: "pixels",
                src: mapMarker,
            }),
        })
        MapMarkerRef.current = new VectorLayer({
            map : mapRef.current,
            source : new VectorSource({
                features : [markerFeature]
            }),
            style : iconStyle
        })

        //? Interactions
        const settle_style = new Style({
            image: new Icon({ src: selectedSettlementIcon}),
        })

        const selectSettleIcon = new Select({ style: settle_style });

        tempSettlementFeature.current = new Feature()

        tempSettlementLayer.current = new VectorLayer({
            map : mapRef.current,
            source : new VectorSource({
                features : [tempSettlementFeature.current]
            }),
            style : settle_style
        })
        tempSettlementLayer.current.setVisible(false)

        mapRef.current.on("click", (e) => {

            setFeatureStat(false)
            setMarkerPlaced(true)
            setMarkerCoords(e.coordinate)

            markerFeature.setGeometry(new Point(e.coordinate))
            MapMarkerRef.current.setVisible(true);

            mapRef.current.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
              if (layer === assetsLayerRefs[0].current) {
                MainStore.setResourceType("Settlement")
                setFeatureStat(true)
                mapRef.current.removeInteraction(selectSettleIcon)
                mapRef.current.addInteraction(selectSettleIcon)
                setSelectedResource(feature.values_)
                console.log(feature.values_)
                tempSettlementFeature.current.setGeometry(new Point(e.coordinate))
                MainStore.setIsResource(true)
                MainStore.setIsOpen(true)
              }
              else if (layer === assetsLayerRefs[1].current) {
                MainStore.setResourceType("Well")
                mapRef.current.removeInteraction(selectSettleIcon)
                setSelectedResource(feature.values_)
                setFeatureStat(true)
                MainStore.setIsResource(true)
                MainStore.setIsOpen(true)
              }
              else if (layer === assetsLayerRefs[2].current) {
                MainStore.setResourceType("Waterbody")
                mapRef.current.removeInteraction(selectSettleIcon)
                setSelectedResource(feature.values_)
                setFeatureStat(true)
                MainStore.setIsResource(true)
                MainStore.setIsOpen(true)
              }
            })
        });
        setIsLoading(false);
    }

    const refreshResourceLayers = async() => {
        
        if(currentStep === 1){
            const settlementLayer = await getVectorLayers(
                "resources",
                "settlement_"+ currentPlan.plan_id + '_' +`${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                true,
                true
            );

            settlementLayer.setStyle(
                new Style({
                  image: new Icon({ src: settlementIcon, scale: 0.4 }),
                })
            );

            assetsLayerRefs[0].current = settlementLayer
        }

        else if(currentStep === 2){
            const wellLayer = await getVectorLayers(
                "resources",
                "well_"+ currentPlan.plan_id + '_' +`${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                true,
                true
            )

            wellLayer.setStyle(function (feature) {
                const status = feature.values_;
                if(status.status_re in iconsDetails.socialMapping_icons.well){
                    return new Style({
                        image: new Icon({ src: iconsDetails.socialMapping_icons.well[status.status_re] }),
                    })
                }
                else{
                    return new Style({
                        image: new Icon({ src: iconsDetails.socialMapping_icons.well["proposed"] }),
                    })
                }
            });
            
            assetsLayerRefs[1].current = wellLayer
        }

        else if(currentStep === 3){
            const waterStructureLayer = await getVectorLayers(
                "resources",
                "waterbody_"+ currentPlan.plan_id + '_' +`${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                true,
                true
            )

            waterStructureLayer.setStyle(function (feature) {
                const status = feature.values_;
                if(status.status_re in iconsDetails.WB_Icons){
                    return new Style({
                        image: new Icon({ src: iconsDetails.WB_Icons[status.wbs_type] }),
                    })
                }
                else{
                    return new Style({
                        image: new Icon({ src: LargeWaterBody }),
                    })
                }
            });

            assetsLayerRefs[2].current = waterStructureLayer
        }

        mapRef.current.addLayer(assetsLayerRefs[stepsDetail[currentScreen]["step-"+currentStep]].current)

    }

    const updateLayersOnStep = async() => {
        const layerCollection = mapRef.current.getLayers();

        if(currentScreen === "Resource_mapping"){
            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current && layer !== MapMarkerRef.current) {
                    layerCollection.remove(layer);
                }
            });
            
            MapMarkerRef.current.setVisible(false);
            setMarkerPlaced(false)

            mapRef.current.addLayer(assetsLayerRefs[currentStep].current)
            if(currentStep > 0){
                tempSettlementLayer.current.setVisible(true)
            }
        }

        else if(currentScreen === "Groundwater"){
            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current && layer !== MapMarkerRef.current) {
                    layerCollection.remove(layer);
                }
            });

            if(groundwaterRefs[1].current === null && currentStep === 1){
                const drainageLayer = await getWebglVectorLayers(
                    "drainage",
                    `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                    true,
                    true
                );
                groundwaterRefs[1].current = drainageLayer
            }

            if(ClartLayerRef.current === null && currentStep === 1){
                const ClartLayer = await getImageLayer(
                    "clart",
                    `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}` + "_clart",
                    true,
                    ""
                )
                ClartLayer.setOpacity(0.6)
                ClartLayerRef.current = ClartLayer
            }

            if(currentStep === 1){
                mapRef.current.addLayer(ClartLayerRef.current)
            }

            mapRef.current.addLayer(groundwaterRefs[currentStep].current)

            mapRef.current.addLayer(assetsLayerRefs[0].current)
            mapRef.current.addLayer(assetsLayerRefs[1].current)
            mapRef.current.addLayer(assetsLayerRefs[2].current)
        }
    }

    const updateLayersOnScreen = async() => {
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
            if(assetsLayerRefs[0].current !== null){
                mapRef.current.addLayer(assetsLayerRefs[0].current)
                mapRef.current.addLayer(assetsLayerRefs[1].current)
                mapRef.current.addLayer(assetsLayerRefs[2].current)
            }
            if(MapMarkerRef.current !== null){
                MapMarkerRef.current.setVisible(false);
                tempSettlementLayer.current.setVisible(false)
            }
        }
        else if(currentScreen === "Resource_mapping"){
            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current && layer !== MapMarkerRef.current) {
                    layerCollection.remove(layer);
                }
            });
            mapRef.current.addLayer(assetsLayerRefs[currentStep].current)
        }
        else if(currentScreen === "Groundwater"){
            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current) {
                    layerCollection.remove(layer);
                }
            });

            if(groundwaterRefs[0].current === null && currentStep === 0){
                const deltaGWellDepth = await getVectorLayers(
                    "mws_layers",
                    "deltaG_well_depth_" + `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                    true,
                    true
                );
                groundwaterRefs[0].current = deltaGWellDepth
            }

            if(groundwaterRefs[2].current === null && currentStep === 0){
                const deltaGWellDepthFortnight = await getVectorLayers(
                    "mws_layers",
                    "deltaG_fortnight_" + `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                    true,
                    true
                );
                groundwaterRefs[2].current = deltaGWellDepthFortnight
            }

            groundwaterRefs[0].current.setStyle(function (feature) {
                const status = feature.values_;
                let tempColor

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
                    })
                });
            });
            mapRef.current.addLayer(groundwaterRefs[2].current)
            mapRef.current.addLayer(groundwaterRefs[currentStep].current)
            mapRef.current.addLayer(assetsLayerRefs[0].current)
            mapRef.current.addLayer(assetsLayerRefs[2].current)
        }
        else if(currentScreen === "SurfaceWater"){
            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current) {
                    layerCollection.remove(layer);
                }
            });

            if(WaterbodiesLayerRef.current === null && currentStep === 0){
                const waterBodyLayers = await getWebglVectorLayers(
                    "water_bodies",
                    `surface_waterbodies_${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                    true,
                    true
                );
                WaterbodiesLayerRef.current = waterBodyLayers
            }
            if(groundwaterRefs[1].current === null && currentStep === 0){
                const drainageLayer = await getWebglVectorLayers(
                    "drainage",
                    `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                    true,
                    true
                );
                groundwaterRefs[1].current = drainageLayer
            }

            mapRef.current.addLayer(NregaWorkLayerRef.current)
            mapRef.current.addLayer(WaterbodiesLayerRef.current)
            mapRef.current.addLayer(groundwaterRefs[1].current)
            mapRef.current.addLayer(assetsLayerRefs[2].current)
        }
        else if(currentScreen === "Agriculture"){
            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current) {
                    layerCollection.remove(layer);
                }
            });

            if(AgriLayersRefs[0].current === null){
                let CroppingIntensity = await getWebglVectorLayers(
                    "cropping_intensity",
                    `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}_intensity`,
                    true,
                    true
                );
                AgriLayersRefs[0].current = CroppingIntensity
            }

            if(AgriLayersRefs[1].current === null){
                let DroughtIntensity = await getWebglVectorLayers(
                    "cropping_drought",
                    `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}_drought`,
                    true,
                    true
                );
                AgriLayersRefs[1].current = DroughtIntensity
            }

            if(LulcLayerRefs[0].current === null){
                let lulcLayer = await getImageLayer(
                    "LULC_level_3",
                    `LULC_17_18_${blockName.toLowerCase().replace(/\s+/g, "_")}_level_3`,
                    true,
                    ""
                )
                LulcLayerRefs[0].current = lulcLayer
                LulcLayerRefs[0].current.setOpacity(0.6)
            }

            mapRef.current.addLayer(LulcLayerRefs[0].current)
            mapRef.current.addLayer(AgriLayersRefs[0].current)
            mapRef.current.addLayer(AgriLayersRefs[1].current)

        }
        else if(currentScreen === "Livelihood"){
            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current) {
                    layerCollection.remove(layer);
                }
            });
        }
    }
    
    const updateLulcLayer = async() => {

        if(currentScreen === "Agriculture"){

            if(LulcLayerRefs[MainStore.lulcYearIdx].current === null){
                let lulcLayer = await getImageLayer(
                    "LULC_level_3",
                    `LULC_${LulcYears[MainStore.lulcYearIdx]}_${blockName.toLowerCase().replace(/\s+/g, "_")}_level_3`,
                    true,
                    ""
                )
                LulcLayerRefs[MainStore.lulcYearIdx].current = lulcLayer
                LulcLayerRefs[MainStore.lulcYearIdx].current.setOpacity(0.6)
            }

            LulcLayerRefs.forEach((item) =>{
                if(item.current !== null)
                    mapRef.current.removeLayer(item.current)
            })

            mapRef.current.addLayer(LulcLayerRefs[MainStore.lulcYearIdx].current)
        }
    }

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

    useEffect(() => {
        if(currentPlan !== null){
            fetchResourcesLayers()
        }
    },[currentPlan])

    useEffect(() => {
        updateLayersOnStep()
    },[currentStep])

    useEffect(() => {
        updateLayersOnScreen()
    },[currentScreen])

    useEffect(() => {
        updateLulcLayer()
    },[MainStore.lulcYearIdx])

    useEffect(() => {

        async function applyNregaStyle(){
            if(NregaWorkLayerRef.current !== null){
                console.log(MainStore.nregaStyle)
                const nregaVectorSource = await NregaWorkLayerRef.current.getSource();
                mapRef.current.removeLayer(NregaWorkLayerRef.current);

                let nregaWebGlLayer = new WebGLPointsLayer({
                    source: nregaVectorSource,
                    style: MainStore.nregaStyle,
                })

                NregaWorkLayerRef.current = nregaWebGlLayer;
                mapRef.current.addLayer(nregaWebGlLayer)
            }
        }

        applyNregaStyle()

    },[MainStore.nregaStyle])

    useEffect(() => {
      
        if(MainStore.isSubmissionSuccess){
            mapRef.current.removeLayer(assetsLayerRefs[stepsDetail[currentScreen]["step-"+currentStep]].current)
            refreshResourceLayers()
        }

    },[MainStore.isSubmissionSuccess])

    return (
        <div className="relative h-full w-full">
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/20">
                    <div className="w-12 h-12 border-6 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
            )}
            <div className="h-full w-full" ref={mapElement} />
        </div>
    );
};

export default MapComponent;
