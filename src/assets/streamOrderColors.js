export const STREAM_ORDER_COLORS = [
    { order: 1, color: "#F6C453" },
    { order: 2, color: "#F28C28" },
    { order: 3, color: "#D96518" },
    { order: 4, color: "#D8F0A2" },
    { order: 5, color: "#70C66B" },
    { order: 6, color: "#27A85B" },
    { order: 7, color: "#147D46" },
    { order: 8, color: "#B5EAF0" },
    { order: 9, color: "#36B4D4" },
    { order: 10, color: "#187DB5" },
    { order: 11, color: "#174A91" },
];

// Raster SLD that colors each integer stream order value; other values stay transparent.
export const getStreamOrderSld = (layerName) => {
    const entries = STREAM_ORDER_COLORS.map(
        ({ order, color }) =>
            `<ColorMapEntry color="${color}" quantity="${order}" label="${order}"/>`,
    ).join("");

    return (
        `<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld">` +
        `<NamedLayer><Name>${layerName}</Name><UserStyle><FeatureTypeStyle><Rule>` +
        `<RasterSymbolizer><ColorMap type="values">${entries}</ColorMap></RasterSymbolizer>` +
        `</Rule></FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>`
    );
};
