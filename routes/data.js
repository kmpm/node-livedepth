'use strict';
const express = require('express');
const router = express.Router();
const fs = require('fs')
const ss = require('simple-statistics');
const turf = require('turf');
const Jimp = require('jimp');

const bm = require('../lib/bm');

var points;

var fil = fs.readFileSync('./public/lake.geojson');
points = JSON.parse(fil.toString());

router.get('/lake', function(req, res) {
    // var collected = turf.collect(points, 'DepthMeter');
    // console.log(collected);
    res.json(points);
});

router.get('/png', function (req, res) {
    
    var bbox = turf.bbox(points);
    bbox[0] = bbox[0] - 0.001115;
    bbox[1] = bbox[1] - 0.001115;
    bbox[2] = bbox[2] + 0.001115;
    bbox[3] = bbox[3] + 0.001115;
    var dem = new bm.Dem(2000, 2000, bbox);
    dem.render(points);
    dem.getPng()
    .then(function (buffer) {
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': buffer.length
        });
        res.end(buffer);
    })
    
});

module.exports = router;