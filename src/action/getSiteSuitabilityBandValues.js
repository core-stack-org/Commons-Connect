/**
 * Gets all band values from the site suitability raster at a given coordinate.
 * The site suitability raster has 7 bands:
 * - Band 1: Constant
 * - Band 2: Climate
 * - Band 3: Soil
 * - Band 4: Socioeconomic
 * - Band 5: Ecology
 * - Band 6: Topography
 * - Band 7: Site Suitability Score
 * 
 * @param {string} districtName - District name
 * @param {string} blockName - Block name
 * @param {number} lon - Longitude coordinate
 * @param {number} lat - Latitude coordinate
 * @returns {Promise<Object|null>} - Object with band labels and values, or null if failed
 */
export default async function getSiteSuitabilityBandValues(districtName, blockName, lon, lat) {
    try {
        const workspace = "plantation";
        const layerName = `${districtName}_${blockName}_site_suitability_raster`;

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

        console.log("Fetching site suitability band values from:", url);
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Failed to fetch site suitability band values for ${layerName}`);
            return null;
        }

        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const properties = data.features[0].properties;
            console.log("Raw properties from GeoServer:", properties);

            // Map the band names to their labels
            // GeoServer returns bands with names like GRAY_INDEX (single band) or 
            // band1, band2, etc. for multi-band rasters
            // Some rasters use different naming conventions
            const bandMapping = {
                "Constant": ["band1", "Band1", "GRAY_INDEX", "constant", "Constant"],
                "Climate": ["band2", "Band2", "climate", "Climate"],
                "Soil": ["band3", "Band3", "soil", "Soil"],
                "Socioeconomic": ["band4", "Band4", "socioeconomic", "Socioeconomic"],
                "Ecology": ["band5", "Band5", "ecology", "Ecology"],
                "Topography": ["band6", "Band6", "topography", "Topography"],
                "Site Suitability Score": ["band7", "Band7", "site_suitability", "Site Suitability Score", "suitability"]
            };

            const result = {};

            // Try to find each band value using possible key names
            for (const [label, possibleKeys] of Object.entries(bandMapping)) {
                for (const key of possibleKeys) {
                    if (properties[key] !== undefined) {
                        result[label] = properties[key];
                        break;
                    }
                }
            }

            // If we couldn't find named bands, try to extract by index from properties
            if (Object.keys(result).length === 0) {
                const keys = Object.keys(properties);
                const bandLabels = [
                    "Constant",
                    "Climate",
                    "Soil",
                    "Socioeconomic",
                    "Ecology",
                    "Topography",
                    "Site Suitability Score"
                ];

                // Sort numeric keys if they exist
                const numericKeys = keys.filter(k => !isNaN(parseInt(k))).sort((a, b) => parseInt(a) - parseInt(b));

                if (numericKeys.length >= 7) {
                    numericKeys.slice(0, 7).forEach((key, index) => {
                        result[bandLabels[index]] = properties[key];
                    });
                } else {
                    // Just use whatever keys are available
                    keys.slice(0, 7).forEach((key, index) => {
                        if (index < bandLabels.length) {
                            result[bandLabels[index]] = properties[key];
                        }
                    });
                }
            }

            // Round numeric values for display
            for (const key of Object.keys(result)) {
                if (typeof result[key] === 'number') {
                    result[key] = Math.round(result[key] * 100) / 100;
                }
            }

            console.log("Parsed band values:", result);
            return result;
        }

        return null;
    } catch (error) {
        console.error(`Error fetching site suitability band values:`, error);
        return null;
    }
}
