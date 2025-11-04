import WebGLTileLayer from 'ol/layer/WebGLTile.js';
import TileWMS from 'ol/source/TileWMS.js';

export default async function getImageLayer(layer_store, layer_name, setVisible = false, style = '') {
    let loadPromiseResolve, loadPromiseReject;
    const loadPromise = new Promise((resolve, reject) => {
        loadPromiseResolve = resolve;
        loadPromiseReject = reject;
    });

    const tileSource = new TileWMS({
        url: `${import.meta.env.VITE_GEOSERVER_URL}` + 'wms',
        params: { 
            'LAYERS': layer_store + ':' + layer_name,
            'STYLES': style,
            'TILED': true,
        },
        ratio: 2,
        serverType: 'geoserver',
    });

    const wmsLayer = new WebGLTileLayer({
        source: tileSource,
    });

    // Track tile loading
    let tilesLoading = 0;
    let tilesLoaded = 0;
    let hasError = false;

    tileSource.on('tileloadstart', () => {
        tilesLoading++;
    });

    tileSource.on('tileloadend', () => {
        tilesLoaded++;
        if (tilesLoaded === tilesLoading && !hasError) {
            loadPromiseResolve();
        }
    });

    tileSource.on('tileloaderror', (event) => {
        hasError = true;
        console.error(`Failed to load tile for "${layer_name}":`, event);
        loadPromiseReject(new Error(`Tile loading failed for ${layer_name}`));
    });

    // Fallback: If no tiles are requested (layer not visible), resolve immediately
    setTimeout(() => {
        if (tilesLoading === 0) {
            loadPromiseResolve();
        }
    }, 100);

    wmsLayer.loadPromise = loadPromise;

    return wmsLayer;
}