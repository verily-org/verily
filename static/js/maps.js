var map_init = function(id, lat, lon) {
    if (lat === undefined) {
        lat = 0;
    }
    if (lon === undefined) {
        lon = 0;
    }
    var map = new OpenLayers.Map(id);
    layer = new OpenLayers.Layer.OSM( "Simple OSM Map");
    map.addLayer(layer);

    map.setCenter(
        new OpenLayers.LonLat(lon, lat).transform(
            new OpenLayers.Projection("EPSG:4326"),
            map.getProjectionObject()
        ), 12
    );

    // Add Vector marker
    var lonLat = new OpenLayers.LonLat(lon, lat)
    .transform(
        new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
        map.getProjectionObject() // to Spherical Mercator Projection
    );
    var point = new OpenLayers.Geometry.Point(lonLat.lon, lonLat.lat);
    var vectorLayer = new OpenLayers.Layer.Vector("Overlay");
    var feature = new OpenLayers.Feature.Vector(
        point,
        {some:'data'},
        {externalGraphic: 'https://01a8501412d0803e3903f1294229a3a0f79f839a.googledrive.com/host/0Bxs8G3uP6XL8Q3ZmQmQwNjRWNXM/location.png', graphicHeight: 21, graphicWidth: 16});
    vectorLayer.addFeatures(feature);
    map.addLayer(vectorLayer);
    return map;
}

var map_add_marker = function(map, lat, long){
    var styleDamage = new OpenLayers.StyleMap({
        pointRadius: 15,
        externalGraphic: 'https://01a8501412d0803e3903f1294229a3a0f79f839a.googledrive.com/host/0Bxs8G3uP6XL8Q3ZmQmQwNjRWNXM/location.png'
    });
    // Layer for placing the damage/impact marker
    var damageLayer = new OpenLayers.Layer.Vector("Damage/Impact Layer", {
        styleMap: styleDamage,
        attribution: 'Marker Icons by <a href="http://mapicons.nicolasmollet.com/">Nicolas Mollet</a>'
    });
    map.addLayer(damageLayer);
    map_set_marker(map, lat, long, damageLayer);
    return damageLayer;
}

var map_set_marker = function(map, lat, long, layer){

    var lonLat = new OpenLayers.LonLat(long, lat)
        .transform(
            new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
            map.getProjectionObject() // to Spherical Mercator Projection
        );
    var point = new OpenLayers.Geometry.Point(lonLat.lon, lonLat.lat);
    layer.addFeatures([new OpenLayers.Feature.Vector(point)]);
    map.setCenter(
        lonLat, 5
    );
}