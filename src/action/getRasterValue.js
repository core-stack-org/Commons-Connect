export default async function getRasterValue(workspace, layerName, lon, lat) {
    try {
        const url = `${import.meta.env.VITE_GEOSERVER_URL}wms?` +
            `SERVICE=WMS&` +
            `VERSION=1.1.1&` +
            `REQUEST=GetFeatureInfo&` +
            `LAYERS=${workspace}:${layerName}&` +
            `QUERY_LAYERS=${workspace}:${layerName}&` +
            `INFO_FORMAT=application/json&` +
            `FEATURE_COUNT=1&` +
            `X=50&Y=50&` +
            `SRS=EPSG:4326&` +
            `WIDTH=101&HEIGHT=101&` +
            `BBOX=${lon - 0.0001},${lat - 0.0001},${lon + 0.0001},${lat + 0.0001}`;
        
        console.log(" URL for raster value: ", url);
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error(`Failed to fetch raster value for ${layerName}`);
            return null;
        }

        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            const properties = data.features[0].properties;
            const value = properties.GRAY_INDEX || properties.value || properties[Object.keys(properties)[0]];
            return value;
        }
        
        return null;
    } catch (error) {
        console.error(`Error fetching raster value for ${layerName}:`, error);
        return null;
    }
}

