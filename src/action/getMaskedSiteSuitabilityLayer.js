import TileLayer from 'ol/layer/Tile.js';
import TileWMS from 'ol/source/TileWMS.js';

/**
 * Creates a terrain cutout mask layer that makes areas with favorable terrain (4, 5, 6, 7)
 * transparent so site suitability shows through, while darkening all other areas.
 * 
 * This layer should be placed ON TOP of the site suitability layer.
 * 
 * @param {string} districtName - District name for layer naming
 * @param {string} blockName - Block name for layer naming
 * @returns {TileLayer} - A tile layer showing terrain cutout mask
 */
export default async function getTerrainCutoutMaskLayer(districtName, blockName) {
    console.log('Creating terrain cutout mask layer for:', districtName, blockName);

    let loadPromiseResolve, loadPromiseReject;
    const loadPromise = new Promise((resolve, reject) => {
        loadPromiseResolve = resolve;
        loadPromiseReject = reject;
    });

    const layerName = `terrain:${districtName}_${blockName}_terrain_raster`;
    console.log('Terrain layer name:', layerName);

    // Source for terrain raster with the cutout mask style
    // This style makes values 4, 5, 6, 7 TRANSPARENT and all others DARK
    const terrainSource = new TileWMS({
        url: `${import.meta.env.VITE_GEOSERVER_URL}wms`,
        params: {
            'LAYERS': layerName,
            'STYLES': 'Terrain_Cutout_Mask_4567',
            'TILED': true,
            'FORMAT': 'image/png',
        },
        ratio: 1,
        serverType: 'geoserver',
    });

    // Use regular TileLayer
    const maskLayer = new TileLayer({
        source: terrainSource,
        opacity: 1,
    });

    // Track tile loading
    let tilesLoading = 0;
    let tilesLoaded = 0;
    let hasError = false;

    terrainSource.on('tileloadstart', () => {
        tilesLoading++;
    });

    terrainSource.on('tileloadend', () => {
        tilesLoaded++;
        if (tilesLoaded === tilesLoading && !hasError) {
            loadPromiseResolve();
        }
    });

    terrainSource.on('tileloaderror', (event) => {
        hasError = true;
        console.error('Failed to load terrain mask tile:', event);
        loadPromiseReject(new Error('Tile loading failed for terrain mask'));
    });

    // Fallback timeout
    setTimeout(() => {
        if (tilesLoading === 0) {
            loadPromiseResolve();
        }
    }, 100);

    maskLayer.loadPromise = loadPromise;

    console.log('Terrain cutout mask layer created successfully');
    return maskLayer;
}
