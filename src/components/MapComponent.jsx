import { useEffect, useRef, useState } from "react";
import useMainStore from "../store/MainStore.jsx";
import getWebglVectorLayers from '../action/getWebglVectorLayers.js';
import getVectorLayers from "../action/getVectorLayers.js";
import getWebGlLayers from "../action/getWebglLayers.js";

//* OpenLayers imports
import "ol/ol.css";
import XYZ from "ol/source/XYZ";
import TileLayer from "ol/layer/Tile";
import Control from 'ol/control/Control.js';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import { Map, View, Feature } from "ol";
import { Style, Icon } from "ol/style.js";
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
import stepsDetail from "../assets/steps.json"


const MapComponent = () => {
    const mapElement = useRef(null);
    const mapRef = useRef(null);
    const baseLayerRef = useRef(null);
    const AdminLayerRef = useRef(null);
    const MapMarkerRef = useRef(null)
    const NregaWorkLayerRef = useRef(null);
    
    const tempSettlementFeature = useRef(null)
    const tempSettlementLayer = useRef(null)

    const [isLoading, setIsLoading] = useState(false);
    const [selectSettle, setCoords] = useState(null)

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
            nregaWorksLayer.setOpacity(0)
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

                const features = mapRef.current.getFeaturesAtPixel(e.pixel, {
                    layerFilter: (layer) => layer === NregaWorkLayerRef.current,
                });

                if (features.length > 0) {
                    MainStore.setIsMetadata(true)
                    MainStore.setMetadata(features[0].values_)
                    MainStore.setIsOpen(true)
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

        mapRef.current.on("click", (e) => {

            setFeatureStat(false)
            setMarkerPlaced(true)
            setMarkerCoords(e.coordinate)

            markerFeature.setGeometry(new Point(e.coordinate))
            MapMarkerRef.current.setVisible(true);

            mapRef.current.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
              if (layer === assetsLayerRefs[0].current) {
                setFeatureStat(true)
                mapRef.current.removeInteraction(selectSettleIcon)
                mapRef.current.addInteraction(selectSettleIcon)
                setCoords(e.coordinate)
                setSelectedResource(feature.values_)
              }
              else if (layer === assetsLayerRefs[1].current) {
                mapRef.current.removeInteraction(selectSettleIcon)
                setFeatureStat(true)
              }
              else if (layer === assetsLayerRefs[2].current) {
                mapRef.current.removeInteraction(selectSettleIcon)
                setFeatureStat(true)
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

            console.log("Reached Here !")
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

    useEffect(() => {
        if (!mapRef.current) {
            initializeMap();
        }

        if (districtName && blockName) {
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
        const layerCollection = mapRef.current.getLayers();

        if(currentScreen === "Resource_mapping"){
            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current && layer !== MapMarkerRef.current) {
                    layerCollection.remove(layer);
                }
            });
            
            MapMarkerRef.current.setVisible(false);
            setMarkerPlaced(false)

            mapRef.current.addLayer(assetsLayerRefs[stepsDetail[currentScreen]["step-"+currentStep]].current)
            if(currentStep !== 1){
                tempSettlementFeature.current.setGeometry(new Point(selectSettle))
            }
        }
    },[currentStep])

    useEffect(() => {
        const layerCollection = mapRef.current.getLayers();
        
        if(currentScreen === "HomeScreen"){
            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current) {
                    layerCollection.remove(layer);
                }
            });
            if(assetsLayerRefs[0].current !== null){
                mapRef.current.addLayer(assetsLayerRefs[0].current)
                mapRef.current.addLayer(assetsLayerRefs[1].current)
                mapRef.current.addLayer(assetsLayerRefs[2].current)
            }
            if(MapMarkerRef.current !== null){
                MapMarkerRef.current.setVisible(false);
            }
            if(tempSettlementFeature.current !== null){
                tempSettlementFeature.current.setGeometry(new Point([61,105]))
            }
        }
    },[currentScreen])

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
            
            console.log("Reached Here 1 !")
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
