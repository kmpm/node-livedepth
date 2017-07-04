
var livemap = (function (exports) {
    'use strict';
    var mymap;
    var depthColor = d3.scale.linear()
    .domain([0,12])
    .range([ '#c2a5cf','#7b3294' ]);


    exports.init = function () {
        console.log('init');
        mymap = L.map('map').setView([59.12766, 12.3751095], 15);
        L.tileLayer('http://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png', {
            maxZoom: 18,
            subdomains: 'abc',
        }).addTo(mymap);

        
    }

    function onEachFeature(feature, layer) {
        // does this feature have a property named popupContent?
        if (feature.properties && feature.properties.DepthMeter) {
            layer.bindPopup(feature.properties.DepthMeter);
        }
    }

    exports.showLines = function () {
        console.log('showLines');
        getJSON('/data/lake')
        .then(function (data) {
            console.log('resolved');
            var layer = L.geoJSON(null, {onEachFeature: onEachFeature})
            .addTo(mymap);
            
            console.log('getting bounds')
            var bbox = getBbox(data);
            console.log('generate grid');
            var grid = turf.squareGrid(bbox, 0.01, 'kilometers');
            console.log('collect');
            var collected = turf.collect(grid, data, 'DepthMeter', 'values');
            console.log('average');
            var centers = [];
            collected.features.forEach(function (f) {
                // console.log(f.properties);
                if (f.properties.values && f.properties.values.length > 0) {
                    f.properties.average = ss.average(f.properties.values);
                    var obj = turf.center(f);
                    obj.type = 'Feature';
                    obj.properties = {
                        DepthMeter: f.properties.average
                    }
                    centers.push(obj);
                }
                else {
                    f.properties.average = 0;
                }
                
            });
            var output = {type: 'FeatureCollection', features:centers};
            console.log('output', output);
            

            // var output = turf.idw(data, 'DepthMeter', 16, 0.01, 'kilometers');
            // output = L.choropleth(output, {
            //     valueProperty: 'DepthMeter',
            //     scale: ['blue', 'yellow',  'red'],
            //     steps: 16,
            //     style: {
            //         color: '#fff',
            //         weight: 2,
            //         fillOpacity: 0.8
            //     }
            // });
            // output.addTo(mymap);
            // var output = turf.tin(data, 'DepthMeter');
            
            // console.log('isobands');
            // var output = turf.isobands(output, getBreaks(1, 20, 1), 'DepthMeter', {});
            console.log('adding layer');
            layer.addData(output);
            // console.log('iso', iso);
            // L.geoJSON(iso).addTo(mymap);
        })
        .catch(function (err) {
            console.error('error', err);
        });
    }

    function getBreaks(min, max, step) {
        var breaks = [];
        for(var i = min; i <= max; i=i+step) {
            breaks.push(i);
        }
        console.log('breaks', breaks);
        return breaks;
    }

    function getJSON(url) {
        return new Promise(function (resolve, reject) {
            console.log('getting JSON %s', url);
            var req = $.ajax({
                dataType: 'json',
                url: url,
                success: function (data) {
                    return resolve(data);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    reject(errorThrown);
                }
            });
        });
    }

    function getBbox(features) {
        return turf.bbox(features);
    }



    function createIsolines(geojson) {
        var resolution = 75;
        var breaks = [1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5,10,10.5,11,11.5,12,12.5,13,13.5,14,14.5,15];
        var isolines = turf.isolines(geojson, breaks,  'DepthMeter');
        isolines.features.forEach(function (feature) {
            feature.properties.stroke = depthColor(feature.properties.DepthMeter);
            feature.properties['stroke-width'] = 1;
            feature.properties['stroke-opacity'] = 0.5;
        });

        return isolines;
    }

return exports;
}(livemap || {}));

livemap.init();
livemap.showLines();



// setTimeout(function () {
//     livemap.showLines()
// }, 500);