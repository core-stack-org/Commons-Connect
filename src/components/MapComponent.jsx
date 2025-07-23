import { useEffect, useRef, useState } from "react";
import useMainStore from "../store/MainStore.jsx";
import useLayersStore from "../store/LayerStore.jsx";
import getWebglVectorLayers from '../action/getWebglVectorLayers.js';
import getVectorLayers from "../action/getVectorLayers.js";
import getWebGlLayers from "../action/getWebglLayers.js";
import getImageLayer from "../action/getImageLayer.js";
import toast from 'react-hot-toast';

//* OpenLayers imports
import "ol/ol.css";
import { easeOut } from 'ol/easing';
import XYZ from "ol/source/XYZ";
import TileLayer from "ol/layer/Tile";
import Control from 'ol/control/Control.js';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import { Map, View, Feature, Geolocation } from "ol";
import { Stroke, Fill, Style, Icon } from "ol/style.js";
import VectorLayer from "ol/layer/Vector.js";
import Point from "ol/geom/Point.js";
import Select from "ol/interaction/Select.js";
import WebGLVectorLayer from 'ol/layer/WebGLVector.js';
import VectorSource from "ol/source/Vector.js";

import settlementIcon from "../assets/settlement_icon.svg"
import LargeWaterBody from "../assets/waterbodiesScreenIcon.svg"
import RechargeIcon from "../assets/recharge_icon.svg"
import IrrigationIcon from "../assets/irrigation_icon.svg"
import selectedSettlementIcon from "../assets/selected_settlement.svg"
import iconsDetails from "../assets/icons.json"
import mapMarker from "../assets/map_marker.svg"
import farm_pond_proposed from "../assets/farm_pond_proposed.svg"
import land_leveling_proposed from "../assets/land_leveling_proposed.svg"
import well_mrker from "../assets/well_icon.svg"
import Man_icon from "../assets/Man_icon.png"
import livelihoodIcon from "../assets/livelihood_proposed.svg"
import fisheriesIcon from "../assets/Fisheries.svg"
import plantationsIcon from "../assets/Plantation.svg"

const WATER_STRUCTURE_MAPPING = {
  GROUNDWATER: [
    'check dam',
    'percolation tank', 
    'earthern gully plugs',
    'drainage/soakage channels',
    'recharge pits',
    'sokage pits', // should be "soakage pits"
    'trench cum bund network',
    'continuous contour trenches (cct)',
    'staggered contour trenches(sct)',
    'water absorption trenches(wat)',
    'rock fill dam',
    'loose boulder structure',
    'stone bunding',
    'diversion drains',
    'contour bunds/graded bunds',
    'bunding:contour bunds/ graded bunds',
    '5% model structure',
    '30-40 model structure'
  ],

  SURFACE_WATERBODIES: [
    'farm pond',
    'canal',
    'check dam',
    'percolation tank',
    'large water bodies',
    'large water body',
    'irrigation channel',
    'rock fill dam',
    'loose boulder structure', 
    'community pond'
  ],

  AGRICULTURE: [
    'farm pond',
    'canal', 
    'farm bund',
    'community pond',
    'well'
  ]
};

function getWaterStructureStyle(feature) {
  const status = feature.values_;
  const wbsType = status.wbs_type?.toLowerCase() || '';
  
  if (status.need_maint === "Yes") {
    try {
      if (wbsType === "trench cum bund network") {
        return new Style({
          image: new Icon({ 
            src: iconsDetails.WB_Icons_Maintenance[status.wbs_type], 
            scale: 0.6 
          }),
        });
      } else {
        return new Style({
          image: new Icon({ 
            src: iconsDetails.WB_Icons_Maintenance[status.wbs_type] 
          }),
        });
      }
    } catch(err) {
      console.log('Maintenance icon not found for:', status.wbs_type);
    }
  }
  
  if (status.wbs_type in iconsDetails.WB_Icons) {
    return new Style({
      image: new Icon({ 
        src: iconsDetails.WB_Icons[status.wbs_type] 
      }),
    });
  }
  
  return new Style({
    image: new Icon({ src: LargeWaterBody }),
  });
}

function shouldShowWaterStructure(wbsType, screen) {
  const normalizedType = wbsType?.toLowerCase() || '';
  
  switch(screen) {
    case 'Groundwater':
      return WATER_STRUCTURE_MAPPING.GROUNDWATER.includes(normalizedType);
    case 'SurfaceWater':
      return WATER_STRUCTURE_MAPPING.SURFACE_WATERBODIES.includes(normalizedType);
    case 'Agriculture':
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
    const MapMarkerRef = useRef(null)
    const NregaWorkLayerRef = useRef(null);
    const ClartLayerRef = useRef(null)
    const WaterbodiesLayerRef = useRef(null)
    const PositionFeatureRef = useRef(null)
    const GeolocationRef = useRef(null)
    const GpsLayerRef = useRef(null)
    
    const tempSettlementFeature = useRef(null)
    const tempSettlementLayer = useRef(null)

    const [isLoading, setIsLoading] = useState(false);

    const MainStore = useMainStore((state) => state);
    const LayersStore = useLayersStore((state) => state)

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
    let AgriLayersRefs = [useRef(null), useRef(null), useRef(null)]
    let LulcYears = {
        0 : "17_18",
        1 : "18_19",
        2 : "19_20",
        3 : "20_21",
        4 : "21_22",
        5 : "22_23",
        6 : "23_24"
    }

    let LivelihoodRefs = [useRef(null)]

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
        
        viewRef.current = view

        const map = new Map({
            target: mapElement.current,
            layers: [baseLayer],
            controls: defaultControls().extend([new GoogleLogoControl()]),
            view,
            loadTilesWhileAnimating: true,
            loadTilesWhileInteracting: true,
        });

        let tempCoords = null

        try{
            navigator.geolocation.getCurrentPosition(
                ({ coords }) => {
                    tempCoords = [coords.longitude, coords.latitude]
                    MainStore.setGpsLocation(tempCoords);
                },
                (err) => console.error('Geo error:', err)
            );

            if(tempCoords === null){
                throw new Error('User Location missing');
            }
        }catch(e){
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
                        }, 7000);
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

                const croppingFeature = mapRef.current.forEachFeatureAtPixel(
                    e.pixel,
                    (feature, layer) => {
                      if (layer === AgriLayersRefs[0].current) {
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
                    MainStore.setFortnightData(fortnightFeature.values_)
                }

                if(waterBodyFeature !== undefined){
                    setSelectedResource(waterBodyFeature.values_)
                    MainStore.setIsWaterBody(true)
                }

                if(croppingFeature !== undefined){
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

        const AgricultureWorkLayer = await getVectorLayers(
            "works",
            `plan_agri_${currentPlan.plan_id}_${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
            true,
            true
        )

        const GroundWaterWorkLayer = await getVectorLayers(
            "works",
            `plan_gw_${currentPlan.plan_id}_${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
            true,
            true
        )

        const livelihoodLayer = await getVectorLayers(
            "works",
            `livelihood_${currentPlan.plan_id}_${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
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
            const m = status.Well_condi.match(/'select_one_maintenance'\s*:\s*'([^']*)'/i);
            const wellMaintenance = m ? m[1].toLowerCase() === 'yes' : null;

            if(status.status_re in iconsDetails.socialMapping_icons.well){
                return new Style({
                    image: new Icon({ src: iconsDetails.socialMapping_icons.well[status.status_re] }),
                })
            }

            else if(wellMaintenance){
                return new Style({
                    image: new Icon({ src: iconsDetails.socialMapping_icons.well["maintenance"], scale : 0.5 }),
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

            if (status.need_maint === "Yes"){
                try{
                    if(status.wbs_type === "Trench cum bund network" || status.wbs_type === "Water absorption trenches(WAT)" || status.wbs_type === "Staggered Contour trenches(SCT)"){
                        return new Style({
                            image: new Icon({ src: iconsDetails.WB_Icons_Maintenance[status.wbs_type], scale: 0.6}),
                        })
                    }else{
                        return new Style({
                            image: new Icon({ src: iconsDetails.WB_Icons_Maintenance[status.wbs_type]}),
                        })
                    }
                }catch(err){
                    console.log(status.wbs_type)
                }
            }
            else if (status.wbs_type in iconsDetails.WB_Icons) {
                return new Style({
                    image: new Icon({ src: iconsDetails.WB_Icons[status.wbs_type]}),
                })
            }
            else{
                return new Style({
                    image: new Icon({ src: LargeWaterBody }),
                })
            }
        });

        AgricultureWorkLayer.setStyle(function (feature) {
            const status = feature.values_;
            if (status.TYPE_OF_WO == "New farm pond") {
                return new Style({
                  image: new Icon({ src: farm_pond_proposed }),
                });
              } else if (status.TYPE_OF_WO == "Land leveling") {
                return new Style({
                  image: new Icon({ src: land_leveling_proposed }),
                });
              } else if (status.TYPE_OF_WO == "New well") {
                return new Style({
                  image: new Icon({ src: well_mrker }),
                });
              } else {
                return new Style({
                  image: new Icon({ src: IrrigationIcon }),
                });
              }
        });

        GroundWaterWorkLayer.setStyle(function (feature) {
            // const status = feature.values_;
            // if(status.work_type in iconsDetails.Recharge_Icons){
            //     return new Style({
            //         image: new Icon({ src: iconsDetails.Recharge_Icons[status.work_type] }),
            //     })
            // }
            // else{
                return new Style({
                    image: new Icon({ src: RechargeIcon }),
                })
            //}
        });

        livelihoodLayer.setStyle(function (feature) {
            if(feature.values_.select_o_5 === "Yes"){
                return new Style({
                    image: new Icon({ src: livelihoodIcon}),
                })
            }
            else if(feature.values_.select_o_6 === "Yes"){
                return new Style({
                    image: new Icon({ src: fisheriesIcon}),
                })
            }
            else {
                return new Style({
                    image: new Icon({ src: plantationsIcon}),
                })
            }
        });

        if(assetsLayerRefs[0].current !== null){mapRef.current.removeLayer(assetsLayerRefs[0].current)}
        if(assetsLayerRefs[1].current !== null){mapRef.current.removeLayer(assetsLayerRefs[1].current)}
        if(assetsLayerRefs[2].current !== null){mapRef.current.removeLayer(assetsLayerRefs[2].current)}
        if(AgriLayersRefs[2].current !== null){mapRef.current.removeLayer(AgriLayersRefs[2].current)}

        assetsLayerRefs[0].current = settlementLayer
        assetsLayerRefs[1].current = wellLayer
        assetsLayerRefs[2].current = waterStructureLayer
        assetsLayerRefs[3].current = cropGridLayer
        AgriLayersRefs[2].current = AgricultureWorkLayer
        groundwaterRefs[3].current = GroundWaterWorkLayer
        LivelihoodRefs[0].current = livelihoodLayer

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
            MainStore.setIsResource(false)

            markerFeature.setGeometry(new Point(e.coordinate))
            MapMarkerRef.current.setVisible(true);


            mapRef.current.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
              if (layer === assetsLayerRefs[0].current) {
                MainStore.setResourceType("Settlement")
                setFeatureStat(true)
                mapRef.current.addInteraction(selectSettleIcon)
                setSelectedResource(feature.values_)
                tempSettlementFeature.current.setGeometry(new Point(e.coordinate))
                MainStore.setSettlementName(feature.values_.sett_name)
                MainStore.setIsResource(true)
                MainStore.setIsResourceOpen(true)
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

              if(feature.geometryChangeKey_.target.flatCoordinates[0] === GeolocationRef.current.position_[0] && feature.geometryChangeKey_.target.flatCoordinates[1] === GeolocationRef.current.position_[1]){
                mapRef.current.removeInteraction(selectSettleIcon)
              }
            })
        });
        setIsLoading(false);
    }

    const refreshResourceLayers = async() => {

        if(currentScreen === "Resource_mapping"){
            mapRef.current.removeLayer(assetsLayerRefs[currentStep].current)

            if(currentStep === 0){
                const settlementLayer = await getVectorLayers(
                    "resources",
                    "settlement_"+ currentPlan.plan_id + '_' +`${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                    true,
                    true
                );

                const tol = 1e-6; 

                settlementLayer.setStyle(function (feature) {
                    const geom = feature.getGeometry();
                    const [x, y] = geom.getCoordinates();
                    if(Math.abs(x - MainStore.markerCoords[0]) < tol && Math.abs(y - MainStore.markerCoords[1]) < tol){
                        MainStore.setSettlementName(feature.values_.sett_name)
                    }
                    return new Style({
                        image: new Icon({ src: settlementIcon, scale: 0.4 }),
                    })
                });

                tempSettlementFeature.current.setGeometry(new Point(MainStore.markerCoords))
                assetsLayerRefs[0].current = settlementLayer
            }

            else if(currentStep === 1){
                const wellLayer = await getVectorLayers(
                    "resources",
                    "well_"+ currentPlan.plan_id + '_' +`${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                    true,
                    true
                )

                wellLayer.setStyle(function (feature) {
                    const status = feature.values_;
                    const m = status.Well_condi.match(/'select_one_maintenance'\s*:\s*'([^']*)'/i);
                    const wellMaintenance = m ? m[1].toLowerCase() === 'yes' : null;

                    if(status.status_re in iconsDetails.socialMapping_icons.well){
                        return new Style({
                            image: new Icon({ src: iconsDetails.socialMapping_icons.well[status.status_re] }),
                        })
                    }

                    else if(wellMaintenance){
                        return new Style({
                            image: new Icon({ src: iconsDetails.socialMapping_icons.well["maintenance"], scale : 0.5 }),
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

            else if(currentStep === 2){
                const waterStructureLayer = await getVectorLayers(
                    "resources",
                    "waterbody_"+ currentPlan.plan_id + '_' +`${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                    true,
                    true
                )

                waterStructureLayer.setStyle(function (feature) {
                    const status = feature.values_;
                    
                    if (status.need_maint === "Yes"){
                        try{
                            return new Style({
                                image: new Icon({ src: iconsDetails.WB_Icons_Maintenance[status.wbs_type]}),
                            })
                        }catch(err){
                            console.log(status.wbs_type)
                        }
                    }
                    else if (status.wbs_type in iconsDetails.WB_Icons) {
                        return new Style({
                            image: new Icon({ src: iconsDetails.WB_Icons[status.wbs_type], scale: 0.5 }),
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

            mapRef.current.addLayer(assetsLayerRefs[currentStep].current)
        }
        else if(currentScreen === "Groundwater"){
            const GroundWaterWorkLayer = await getVectorLayers(
                "works",
                `plan_gw_${currentPlan.plan_id}_${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                true,
                true
            )
            GroundWaterWorkLayer.setStyle(function (feature) {
                return new Style({
                    image: new Icon({ src: RechargeIcon }),
                })
            });

            mapRef.current.removeLayer(groundwaterRefs[2].current)
            groundwaterRefs[3].current = GroundWaterWorkLayer
            mapRef.current.addLayer(groundwaterRefs[3].current)
        }
        else if(currentScreen === "Agriculture"){
            const AgricultureWorkLayer = await getVectorLayers(
                "works",
                `plan_agri_${currentPlan.plan_id}_${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                true,
                true
            )
            AgricultureWorkLayer.setStyle(function (feature) {
                const status = feature.values_;
                if (status.TYPE_OF_WO == "New farm pond") {
                    return new Style({
                      image: new Icon({ src: farm_pond_proposed }),
                    });
                  } else if (status.TYPE_OF_WO == "Land leveling") {
                    return new Style({
                      image: new Icon({ src: land_leveling_proposed }),
                    });
                  } else if (status.TYPE_OF_WO == "New well") {
                    return new Style({
                      image: new Icon({ src: well_mrker }),
                    });
                  } else {
                    return new Style({
                      image: new Icon({ src: IrrigationIcon }),
                    });
                  }
            });

            mapRef.current.removeLayer(AgriLayersRefs[2].current)
            AgriLayersRefs[2].current = AgricultureWorkLayer
            mapRef.current.addLayer(AgriLayersRefs[2].current)
        }
        else if(currentScreen === "Livelihood"){
            const livelihoodLayer = await getVectorLayers(
                "works",
                `livelihood_${currentPlan.plan_id}_${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                true,
                true
            )
            livelihoodLayer.setStyle(function (feature) {
                if(feature.values_.select_o_3 === "Yes"){
                    return new Style({
                        image: new Icon({ src: livelihoodIcon}),
                    })
                }
                else if(feature.values_.select_one === "Yes"){
                    return new Style({
                        image: new Icon({ src: fisheriesIcon}),
                    })
                }
                else {
                    return new Style({
                        image: new Icon({ src: plantationsIcon}),
                    })
                }
            });
            mapRef.current.removeLayer(LivelihoodRefs[0].current)
            LivelihoodRefs[0].current = livelihoodLayer
            mapRef.current.addLayer(LivelihoodRefs[0].current)
        }
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
            if(currentStep === 2){
                if(WaterbodiesLayerRef.current === null){
                    const waterBodyLayers = await getWebglVectorLayers(
                        "swb",
                        `surface_waterbodies_${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                        true,
                        true
                    );
                    WaterbodiesLayerRef.current = waterBodyLayers
                }
                mapRef.current.addLayer(WaterbodiesLayerRef.current)
            }
        }

        else if(currentScreen === "Groundwater"){
            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current && layer !== MapMarkerRef.current) {
                    layerCollection.remove(layer);
                }
            });
            
            //? Code has been changed here from previous ones, the previous was working fine, check previous commit and match the changes, the offline has the code in the commit before this
            // Step 0
            if(currentStep === 0){

                if(groundwaterRefs[2].current !== null){
                    mapRef.current.addLayer(groundwaterRefs[2].current) // Fortnight layer
                }
                if(groundwaterRefs[0].current !== null){
                    mapRef.current.addLayer(groundwaterRefs[0].current) // Well depth layer
                }

                mapRef.current.addLayer(assetsLayerRefs[0].current) // Settlement layer
                mapRef.current.addLayer(assetsLayerRefs[2].current)
                mapRef.current.addLayer(groundwaterRefs[3].current) // Works layer

                LayersStore.setSettlementLayer(true)
                LayersStore.setWellDepth(true)
                LayersStore.setDrainageLayer(false)
                LayersStore.setCLARTLayer(false)
                LayersStore.setWaterStructure(false)
                LayersStore.setWorkGroundwater(true)
            }
            
            // Step 1: In the planning step
            // TODO: Should I show works layer in both the steps?
            if(currentStep === 1){
                if(ClartLayerRef.current !== null){
                    ClartLayerRef.current.setOpacity(0.4)
                    mapRef.current.addLayer(ClartLayerRef.current) // CLART layer
                }
                if(groundwaterRefs[1].current !== null){
                    mapRef.current.addLayer(groundwaterRefs[1].current) // Drainage layer
                }
                if(groundwaterRefs[3].current !== null){
                    mapRef.current.addLayer(groundwaterRefs[3].current) // Works layer
                }
                mapRef.current.addLayer(assetsLayerRefs[2].current)
                
                LayersStore.setSettlementLayer(true)
                LayersStore.setWellDepth(false)
                LayersStore.setDrainageLayer(true)
                LayersStore.setCLARTLayer(true)
                LayersStore.setWaterStructure(false)
                LayersStore.setWorkGroundwater(true)
            }
        }
        
        else if(currentScreen === "Agriculture"){
            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current && layer !== AgriLayersRefs[0].current && layer !== MapMarkerRef.current) {
                    layerCollection.remove(layer);
                }
            });

            if(currentStep === 0){
                mapRef.current.addLayer(LulcLayerRefs[0].current)
                mapRef.current.addLayer(AgriLayersRefs[0].current)
                mapRef.current.addLayer(AgriLayersRefs[1].current)
                mapRef.current.addLayer(AgriLayersRefs[2].current)
                mapRef.current.addLayer(assetsLayerRefs[0].current)
                mapRef.current.addLayer(assetsLayerRefs[1].current)
                mapRef.current.addLayer(assetsLayerRefs[2].current)
            }
            if(currentStep === 1){
                if(!layerCollection.getArray().some(layer => layer === ClartLayerRef.current)){
                    mapRef.current.addLayer(ClartLayerRef.current)
                    LayersStore.setCLARTLayer(true)
                }
                else{
                    LayersStore.setCLARTLayer(false)
                }
    
                if(!layerCollection.getArray().some(layer => layer === groundwaterRefs[1].current)){
                    mapRef.current.addLayer(groundwaterRefs[1].current)
                    LayersStore.setDrainageLayer(true)
                }
                else{
                    LayersStore.setDrainageLayer(false)
                }
                //mapRef.current.addLayer(assetsLayerRefs[1].current)
                mapRef.current.addLayer(assetsLayerRefs[2].current)
                mapRef.current.addLayer(AgriLayersRefs[2].current)
            }
        }
        
        else if(currentScreen === "Livelihood"){
            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current) {
                    layerCollection.remove(layer);
                }
            });


            if(currentStep === 0){
                mapRef.current.addLayer(assetsLayerRefs[0].current)
            }

            MapMarkerRef.current.setVisible(false);
            setMarkerPlaced(false)
            
            if(currentStep > 0){
                mapRef.current.addLayer(LivelihoodRefs[0].current)
                tempSettlementLayer.current.setVisible(true)
            }
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
                assetsLayerRefs[2].current.setStyle(getWaterStructureStyle);
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
            MainStore.setFeatureStat(false)
            MainStore.setMarkerPlaced(false)
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

            if(groundwaterRefs[1].current === null){
                const drainageLayer = await getWebglVectorLayers(
                    "drainage",
                    `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                    true,
                    true
                );
                groundwaterRefs[1].current = drainageLayer
            }

            if(ClartLayerRef.current === null){
                const ClartLayer = await getImageLayer(
                    "clart",
                    `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}` + "_clart",
                    true,
                    ""
                )
                ClartLayer.setOpacity(0.4)
                ClartLayerRef.current = ClartLayer
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
            mapRef.current.addLayer(groundwaterRefs[3].current)
            assetsLayerRefs[2].current.setStyle(function (feature) {
                if (shouldShowWaterStructure(feature.get('wbs_type'), 'Groundwater')) {
                    return getWaterStructureStyle(feature);
                }
                return null;
            });
            mapRef.current.addLayer(assetsLayerRefs[2].current)

            LayersStore.setAdminBoundary(true)
            LayersStore.setWellDepth(true)
            LayersStore.setSettlementLayer(true)
            LayersStore.setWaterStructure(true)
            LayersStore.setWorkGroundwater(true)
        }
        else if(currentScreen === "SurfaceWater"){
            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current) {
                    layerCollection.remove(layer);
                }
            });

            if(WaterbodiesLayerRef.current === null && currentStep === 0){
                const waterBodyLayers = await getWebglVectorLayers(
                    "swb",
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

            assetsLayerRefs[2].current.setStyle(function (feature) {
                if (shouldShowWaterStructure(feature.get('wbs_type'), 'SurfaceWater')) {
                    return getWaterStructureStyle(feature);
                }
                return null;
            });

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

            if(ClartLayerRef.current === null){
                const ClartLayer = await getImageLayer(
                    "clart",
                    `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}` + "_clart",
                    true,
                    ""
                )
                ClartLayer.setOpacity(0.4)
                ClartLayerRef.current = ClartLayer
            }

            if(groundwaterRefs[1].current === null){
                const drainageLayer = await getWebglVectorLayers(
                    "drainage",
                    `${districtName.toLowerCase().replace(/\s+/g, "_")}_${blockName.toLowerCase().replace(/\s+/g, "_")}`,
                    true,
                    true
                );
                groundwaterRefs[1].current = drainageLayer
            }

            mapRef.current.addLayer(LulcLayerRefs[0].current)
            mapRef.current.addLayer(AgriLayersRefs[0].current)
            mapRef.current.addLayer(AgriLayersRefs[1].current)
            mapRef.current.addLayer(AgriLayersRefs[2].current)
            mapRef.current.addLayer(assetsLayerRefs[0].current)
            mapRef.current.addLayer(assetsLayerRefs[1].current)

            assetsLayerRefs[2].current.setStyle(function (feature) {
                if (shouldShowWaterStructure(feature.get('wbs_type'), 'Agriculture')) {
                    return getWaterStructureStyle(feature);
                }
                return null;
            });

            mapRef.current.addLayer(assetsLayerRefs[2].current)

            LayersStore.setAdminBoundary(true)
            LayersStore.setLULCLayer(true)
            LayersStore.setWorkAgri(true)

            if(!layerCollection.getArray().some(layer => layer === ClartLayerRef.current)){
                LayersStore.setCLARTLayer(false)
            }
        }
        else if(currentScreen === "Livelihood"){
            layerCollection.getArray().slice().forEach(layer => {
                if (layer !== baseLayerRef.current && layer !== AdminLayerRef.current) {
                    layerCollection.remove(layer);
                }
            });

            mapRef.current.addLayer(assetsLayerRefs[0].current)
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
            
            PositionFeatureRef.current = positionFeature;
            
            let tempCoords = MainStore.gpsLocation
            if(tempCoords === null){
                try{
                    navigator.geolocation.getCurrentPosition(
                        ({ coords }) => {
                            tempCoords = [coords.longitude, coords.latitude]
                            MainStore.setGpsLocation(tempCoords);
                        },
                        (err) => console.error('Geo error:', err)
                    );

                        if(tempCoords === null){
                            throw new Error('User Location missing');
                        }
                }catch(err){
                    GeolocationRef.current.on("change:position", function () {
                            const coordinates = GeolocationRef.current.getPosition();
                            if (coordinates) {
                            MainStore.setGpsLocation(coordinates);
                            
                            positionFeature.setGeometry(new Point(coordinates));
                        }
                    });
                }
            }
            // Animate to new position with smooth pan
            const view = mapRef.current.getView();

            if(tempCoords === null){
                toast("Getting GPS !");
                return
            }
            
            // First pan to location
            view.animate({
                center: tempCoords,
                duration: 1000,
                easing: easeOut
            });
            
            // Then zoom in to level 17 with animation
            view.animate({
                zoom: 17,
                duration: 1200,
                easing: easeOut
            });
            
            positionFeature.setGeometry(new Point(tempCoords));
        
            // Create GPS layer
            let gpsLayer = new VectorLayer({
                    map: mapRef.current,
                    source: new VectorSource({
                    features: [positionFeature],
                }),
                zIndex: 99 // Ensure it's on top
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
        if (PositionFeatureRef.current !== null && MainStore.gpsLocation !== null && MainStore.isGPSClick) {
            const view = mapRef.current.getView();
                
            if(MainStore.gpsLocation === null){
                toast.error("Not able to get Location !");
                return
            }

            // Sequence of animations for smoother experience
            // 1. First start panning
            view.animate({
                center: MainStore.gpsLocation,
                duration: 800,
                easing: easeOut
            });
            
            // 2. Then always animate to zoom level 17 regardless of current zoom
            view.animate({
                zoom: 17,
                duration: 1000,
                easing: easeOut
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
                const nregaVectorSource = await NregaWorkLayerRef.current.getSource();
                mapRef.current.removeLayer(NregaWorkLayerRef.current);

                let nregaWebGlLayer = new WebGLVectorLayer({
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
            refreshResourceLayers()
            MainStore.setIsSubmissionSuccess(false)
        }

    },[MainStore.isSubmissionSuccess])

    useEffect(() => {
        if(groundwaterRefs[0].current !== null){
            groundwaterRefs[0].current.setStyle(function (feature) {
                const status = feature.values_;
                let tempColor

                if(MainStore.selectWellDepthYear === '2018_23'){
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
                } else{
                    if(status.Net2017_22 < -5){tempColor = "rgba(255, 0, 0, 0.5)"}
                    else if(status.Net2017_22 >= -5 && status.Net2017_22 < -1){tempColor = "rgba(255, 255, 0, 0.5)"}
                    else if(status.Net2017_22 >= -1 && status.Net2017_22 <= 1){tempColor = "rgba(0, 255, 0, 0.5)"}
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
    },[MainStore.selectWellDepthYear])

    useEffect(() => {
        const layerCollection = mapRef.current.getLayers();

            if(MainStore.layerClicked !== null){
                if(MainStore.layerClicked === "AdminBoundary"){
                        if(LayersStore[MainStore.layerClicked] && !layerCollection.getArray().some(layer => layer === AdminLayerRef.current)){mapRef.current.addLayer(AdminLayerRef.current)}
                        else{mapRef.current.removeLayer(AdminLayerRef.current)}
                }

                else if(MainStore.layerClicked === "NregaLayer"){
                    if(LayersStore[MainStore.layerClicked] && !layerCollection.getArray().some(layer => layer === NregaWorkLayerRef.current)){mapRef.current.addLayer(NregaWorkLayerRef.current)}
                    else{mapRef.current.removeLayer(NregaWorkLayerRef.current)}
                }
                
                else if(MainStore.layerClicked === "WellDepth"){
                    if(LayersStore[MainStore.layerClicked] && !layerCollection.getArray().some(layer => layer === groundwaterRefs[0].current)){mapRef.current.addLayer(groundwaterRefs[0].current)}
                    else{mapRef.current.removeLayer(groundwaterRefs[0].current)}
                }

                else if(MainStore.layerClicked === "DrainageLayer"){
                    if(LayersStore[MainStore.layerClicked] && !layerCollection.getArray().some(layer => layer === groundwaterRefs[1].current)){mapRef.current.addLayer(groundwaterRefs[1].current)}
                    else{mapRef.current.removeLayer(groundwaterRefs[1].current)}
                }

                else if(MainStore.layerClicked === "SettlementLayer"){
                    if(LayersStore[MainStore.layerClicked] && !layerCollection.getArray().some(layer => layer === assetsLayerRefs[0].current)){mapRef.current.addLayer(assetsLayerRefs[0].current)}
                    else{mapRef.current.removeLayer(assetsLayerRefs[0].current)}
                }

                else if(MainStore.layerClicked === "WellLayer"){
                    if(LayersStore[MainStore.layerClicked] && !layerCollection.getArray().some(layer => layer === assetsLayerRefs[1].current)){mapRef.current.addLayer(assetsLayerRefs[1].current)}
                    else{mapRef.current.removeLayer(assetsLayerRefs[1].current)}
                }

                else if(MainStore.layerClicked === "WaterStructure"){
                    if(LayersStore[MainStore.layerClicked] && !layerCollection.getArray().some(layer => layer === assetsLayerRefs[2].current)){mapRef.current.addLayer(assetsLayerRefs[2].current)}
                    else{mapRef.current.removeLayer(assetsLayerRefs[2].current)}
                }

                else if(MainStore.layerClicked === "WorkAgri"){
                    if(LayersStore[MainStore.layerClicked] && !layerCollection.getArray().some(layer => layer === AgriLayersRefs[2].current)){mapRef.current.addLayer(AgriLayersRefs[2].current)}
                    else{mapRef.current.removeLayer(AgriLayersRefs[2].current)}
                }

                else if(MainStore.layerClicked === "WorkGroundwater"){
                    if(LayersStore[MainStore.layerClicked] && !layerCollection.getArray().some(layer => layer === groundwaterRefs[3].current)){mapRef.current.addLayer(groundwaterRefs[3].current)}
                    else{mapRef.current.removeLayer(groundwaterRefs[3].current)}
                }

                else if(MainStore.layerClicked === "Livelihood"){
                    if(LayersStore[MainStore.layerClicked] && !layerCollection.getArray().some(layer => layer === LivelihoodRefs[0].current)){mapRef.current.addLayer(LivelihoodRefs[0].current)}
                    else{mapRef.current.removeLayer(LivelihoodRefs[0].current)}
                }

                else if(MainStore.layerClicked === "CLARTLayer"){
                    if(LayersStore[MainStore.layerClicked] && !layerCollection.getArray().some(layer => layer === ClartLayerRef.current)){mapRef.current.addLayer(ClartLayerRef.current)}
                    else{mapRef.current.removeLayer(ClartLayerRef.current)}
                }
           }

    },[LayersStore])

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