import WebGLTileLayer from 'ol/layer/WebGLTile.js';
import TileWMS        from 'ol/source/TileWMS.js';

export default async function getImageLayer(layer_store, layer_name, setVisible = false, style = '') {
    const wmsLayer = new WebGLTileLayer({
      source: new TileWMS({
        url: `${import.meta.env.VITE_GEOSERVER_URL}`+'wms',
        params: { 
          'LAYERS': layer_store + ':' + layer_name,
          'STYLES' : style,
          'TILED': true,
        },
        ratio: 2,
        serverType: 'geoserver',
      }),
    })

    return wmsLayer;
}










