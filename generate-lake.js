'use strict';
const debug = require('debug')('livedepth:generate-lake');
const sl2 = require('sl2format');
const fs = require('fs');
const path = require('path');
const through2 = require('through2');
const uuidv1 = require('uuid/v1');


const DATAPATH = path.join('private', 'lake');

const options = {
    feetToMeter: true,
    convertProjection: true,
    radToDeg: true,
    flags: {
        positionValid: true
    }
}

const sl2reader = new sl2.Reader(options);


function doFile(file) {
    return (err, stats) => {
        var output;
        if (!stats.isFile()) {
            return;
        }
        debug('working on %s', file);
        var ws = fs.createWriteStream(path.join('public', 'lake.geojson'));
        ws.write('{\n\t"type":"FeatureCollection",\n\t"features": [\n');
        var reader = fs.createReadStream(file);
        reader.pipe(sl2reader)
        .pipe(through2.obj(function (obj, enc, next) {
            if (obj) {
                var f = {
                    type:'Feature',
                    properties: {
                        OBJECTID: obj.frameIndex,
                        DepthMeter: obj.waterDepth,
                        Acc_Averag: 0,
                        Acc_Worst: 0,
                        GlobalID: uuidv1()
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: [obj.longitude, obj.latitude]
                    }
                };
                this.push(new Buffer('\t\t' + JSON.stringify(f) + ',\n'));
            }
            next();
        }))
        .pipe(ws, {end: false})
        .on('finish', function () {
            debug('finish');
        });
        reader.on('end', function () {
            debug('end');
            ws.write('\t]\n}');
            ws.end();
        })
    }
}

function main() {
    fs.readdir(DATAPATH, function (err, items) {
        items.forEach((item) => {
            var file = path.join(DATAPATH, item);
            fs.stat(file, doFile(file));
        });
    });
}

if (typeof require != 'undefined' && require.main==module) {
    main();
}