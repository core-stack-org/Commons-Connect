import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';

export default async function getImageLayer(layer_store, layer_name, setVisible = false, style = '') {
    const wmsLayer = new ImageLayer({
      source: new ImageWMS({
        url: `${import.meta.env.VITE_GEOSERVER_URL}`+'wms',
        params: { 
          'LAYERS': layer_store + ':' + layer_name,
          'STYLES' : style
        },
        ratio: 1,
        serverType: 'geoserver',
      }),
      visible: setVisible,
      name : layer_name
    })
    return wmsLayer;
}










