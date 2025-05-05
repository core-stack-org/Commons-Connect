import Vector from "ol/source/Vector";
import GeoJSON from 'ol/format/GeoJSON';

import WebGLVectorLayer from 'ol/layer/WebGLVector.js';

const style = {
  'stroke-color': 'black',
  'stroke-width': 2,
}

export default async function getWebglVectorLayers (layer_store, layer_name, setVisible = true, setActive = true, resource_type = null , plan_id = null, district, block) {
  
    let url = 
    (plan_id === null ? 
        `${import.meta.env.VITE_GEOSERVER_URL}` + layer_store + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + layer_store + ':' + layer_name + "&outputFormat=application/json&screen=main"
        :
        `${import.meta.env.VITE_GEOSERVER_URL}` + layer_store + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + layer_store +':' + resource_type + "_" + plan_id + "_" + district + "_" + block + "&outputFormat=application/json&screen=main")
  
    const vectorSource = new Vector({
      url: url,
      format: new GeoJSON(),
      loader: function (extent, resolution, projection) {
       fetch(url).then(response => {
         if (!response.ok) {
           console.log('Network response was not ok for ' + layer_name);
           return null;
         }
         return response.json();
        }).then(json => {
          vectorSource.addFeatures(vectorSource.getFormat().readFeatures(json));
        }).catch(error => {
         console.log(`Failed to load the "${layer_name}" layer. Please check your connection or the map layer details.`,error)
        });
      }
    });

    const wmsLayer = new WebGLVectorLayer({
      source: vectorSource,
      style,
    });

  //  const wmsLayer = new VectorLayer({
  //    source: vectorSource,
  //    visible: setVisible,
  //    hover: setActive,
  //    myData: Math.random()
  //  });
 
  //  if (layer_store === "panchayat_boundaries") {
  //    wmsLayer.setStyle(PanchayatBoundariesStyle);
  //  }


 
   return wmsLayer;
}
