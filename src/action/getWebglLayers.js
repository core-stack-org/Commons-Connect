import Vector from "ol/source/Vector";
import GeoJSON from 'ol/format/GeoJSON';

import WebGLVectorLayer from 'ol/layer/WebGLVector.js';

const colorMapping = {
  "Household Livelihood": 1, // Maroon
  "Others - HH, Community": 2, // Blue-Grey
  "Agri Impact - HH, Community": 3, // Yellow
  "SWC - Landscape level impact": 4, // Brown
  "Irrigation - Site level impact": 5, // Blue
  "Plantation": 6, // Green
  "Un Identified": 7, // Lavender
  "Default": 8, // Tan
};


export default async function getWebGlLayers(layer_store, layer_name, setAllNregaYears){

    let url = `${import.meta.env.VITE_GEOSERVER_URL}` + layer_store + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + layer_store + ':' + layer_name + "&outputFormat=application/json&screen=main"

    let nregaYears_temp = [];

    const vectorSource = new Vector({
      url: url,
      format: new GeoJSON(),
      loader: async function (extent, resolution, projection) {
        await fetch(url).then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok for ' + layer_name);
          }
          return response.json();
        }).then(json => {
          vectorSource.addFeatures(vectorSource.getFormat().readFeatures(json).map((item)=>{
  
            item.values_.itemColor = colorMapping[item.values_.WorkCatego] ? colorMapping[item.values_.WorkCatego] : colorMapping["Default"]
            
            let temp_year = new Date(Date.parse(item.values_.creation_t)).getFullYear()
            item.values_.workYear = temp_year.toString();

            if (!nregaYears_temp.includes(temp_year)) {
              nregaYears_temp.push(temp_year);
            }
            nregaYears_temp.sort();
            //console.log(item)
            return item;
  
          }));
        }).catch(error => {
          console.log(error);
        });
      }
    });

    let tempActiveYears = [2022]

    const NregaStyle = {
      'shape-points': 12,
      'shape-radius': 6,
      'shape-fill-color': [
        'match',
        ['get', 'itemColor'],
        4,
        '#6495ED',
        '#00000000'
      ],
    }
    
    setAllNregaYears(nregaYears_temp);
  
    let wmsLayer = new WebGLVectorLayer({
      source : vectorSource,
      variables : {
        activeYears : tempActiveYears
      },
      style: NregaStyle,
    })
  
    return wmsLayer;
}