'use strict';
//bathymetry helper stuff....
const debug = require('debug')('livedepth:bm');
const turf = require('turf');
// const Jimp = require('jimp');
const PImage = require('pureimage');


const MINX=0;
const MINY=1;
const MAXX=2;
const MAXY=3;

function toDegrees(rad) {
    return rad / 180 * Math.PI;
}

function cosDegrees(rad) {
    return Math.cos(toDegrees(rad));
}

function sinDegrees(rad) {
    return Math.sin(toDegrees(rad));
}

var getLocationCoords = exports.getLocationCoords = function (lat, lon, width, height, zoom) {
    if (typeof zoom !== 'numeric') {
        zoom = -10000
    }

    var x = cosDegrees(lat) * cosDegrees(lon) * width;
    var y = cosDegrees(lat) * sinDegrees(lon) * height;
    return {x: x, y: y};
};



class Dem {
    constructor(width, height, bbox) {
        this.width = width;
        this.height = height;
        this.bbox = bbox;
        //LON = X, LAT = Y
        
        this.xDelta = bbox[MAXX] - bbox[MINX];
        this.yDelta = bbox[MAXY] - bbox[MINY];
        this.worldMapWidth = ((this.width / this.xDelta) * 360) / (2 * Math.PI);
        // this.image = new Jimp(width, height);
        this.image = PImage.make(this.width, this.height);
        debug('dem', this);
    }

    get top() {
        return this.bbox[MAXY];
    }

    get bottom() {
        return this.bbox[MINY];
    }

    get left() {
        return this.bbox[MINX];
    }

    get right() {
        return this.bbox[MAXX];
    }
    get maxY() {
        return this.bbox[MAXY];
    }
    get minY() {
        return this.bbox[MINY];
    }

    get minX() {
        return this.bbox[MINX];
    }

    convertGeoToPixel(lat, lon) {
        var x = (this.right - lon) * (this.width / this.xDelta)
        
        // lat = toDegrees(lat);
        // var mapOffsetY = (this.worldMapWidth / 2 * Math.log( (1 + sinDegrees(this.bottom)) / (1 - sinDegrees(this.bottom))));
        // var y = this.height - (this.worldMapWidth / 2 * Math.log( (1 + sinDegrees(lat) / (1 - sinDegrees(lat) )) ) ) - mapOffsetY;

        var y = (lat - this.bottom) * (this.height / this.yDelta);
        return {x: Math.round(x), y: Math.round(y)};
    }

    getPng() {
        return new Promise((resolve, reject) => {
            this.image.getBuffer(Jimp.MIME_PNG, function (err, buffer) {
                if (err) {
                    return reject(err);
                }
                return resolve(buffer);
            });
        });
    }

    render(points) {
    
        points.features.forEach( (feature, index) => {
            var coords = this.convertGeoToPixel(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
            var color = Jimp.rgbaToInt(255, Math.round(feature.properties.DepthMeter) * 1.25,0,255);
            //debug('setting point %j to %s', coords, color);
            this.image.setPixelColor(color, coords.x, coords.y);
        });
    }
}
 exports.Dem = Dem;
