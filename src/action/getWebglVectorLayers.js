import Vector from "ol/source/Vector";
import GeoJSON from 'ol/format/GeoJSON';

import WebGLVectorLayer from 'ol/layer/WebGLVector.js';


export default async function getWebglVectorLayers (layer_store, layer_name, setVisible = true, setActive = true, resource_type = null , plan_id = null, district, block) {
    let url = 
    (plan_id === null ? 
        `${import.meta.env.VITE_GEOSERVER_URL}` + layer_store + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + layer_store + ':' + layer_name + "&outputFormat=application/json&screen=main"
        :
        `${import.meta.env.VITE_GEOSERVER_URL}` + layer_store + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + layer_store +':' + resource_type + "_" + plan_id + "_" + district + "_" + block + "&outputFormat=application/json&screen=main")
    const vectorSource = new Vector({
      url: url,
      format: new GeoJSON(),
      loader: async function (extent, resolution, projection) {
        await fetch(url).then(response => {
         if (!response.ok) {
           console.log('Network response was not ok for ' + layer_name);
           return null;
         }
         return response.json();
        }).then(json => {
          vectorSource.addFeatures(
            vectorSource.getFormat().readFeatures(json).map((item) => {
              if(layer_store === "drainage"){
                item.values_.itemColor = item.values_.ORDER-1
              }
              return item;
            })
          );          
        }).catch(error => {
          console.log(error)
         console.log(`Failed to load the "${layer_store}" layer. Please check your connection or the map layer details.`,error)
        });
      }
    });

    let style = {}

    if(layer_store === "panchayat_boundaries"){
      style = {
        'stroke-color': 'black',
        'stroke-width': 2,
      }
    }
    else if(layer_store === "swb"){
      style = {
        'stroke-color': '#21618c',
        'stroke-width': 3,
        'fill-color' : "rgba(33, 97, 140, 0.5)"
      }
    }
    else if(layer_store === "cropping_intensity"){
      style = {
        'stroke-color': '#e4c1f9',
        'stroke-width': 2,
        'fill-color' : "rgba(255, 255, 255, 0.1)"
      }
    }
    else{
      style = {
        'stroke-color': [
          'match', 
          ['get', 'itemColor'],
          0,
          "#03045E",
          1,
          "#023E8A",
          2,
          "#0077B6",
          3,
          "#0096C7",
          4,
          "#00B4D8",
          5,
          "#48CAE4",
          6,
          "#90E0EF",
          7,
          "#ADE8F4",
          8,
          "#CAF0F8",
          [255, 255, 255, 0.6]
        ],
        'stroke-width': 2,
      }
    }
  

    const wmsLayer = new WebGLVectorLayer({
      source: vectorSource,
      style,
    });
 
   return wmsLayer;
}
