var page = require('webpage').create(); page.viewportSize = { width: 2127, height: 1292 }; page.open('http://0.0.0.0:8000/#/econ/contagion/tile-grid-map?si=2&sc=56&t=light', function(status) { setTimeout(function(){ page.render('viz3.png'); console.log('completed'); phantom.exit(); },1000); });
