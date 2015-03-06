var request = require("request");
var express = require('express');
var cors = require('cors')
var pg = require('pg');
var fs = require('fs');
var reproject = require('reproject');
var terraformer = require('terraformer-wkt-parser');
var jsts = require('jsts');
var path = require('path');
var bodyParser = require('body-parser');
var moment = require('moment');
var pgConfig = require('./config/pgConfig');
var gc2Config = require('./config/gc2Config');
var http = require('http');
var querystring = require('querystring');

var app = express();
var buffer = 0;
var socketId;
var db;
var schema;
var text;
var fileName;
var baseLayer;
var layers;
var addr;

// Set locale for date/time string
moment.locale("da");

//app.use(cors());

app.use(bodyParser.urlencoded({extended: true}));

app.set('views', __dirname + '/views');

app.set('view engine', 'jade');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/static', function (req, response) {
    response.setHeader('Content-Type', 'application/json');
    response.sendFile(__dirname + '/tmp/' + req.query.id);
});

app.get('/pdf', function (req, response) {
    var url = "http://localhost:8181/?url=127.0.0.1:8080/html?id=" + req.query.id;
    http.get(url, function (res) {
        var chunks = [];
        res.on('data', function (chunk) {
            chunks.push(chunk);
        });
        res.on("end", function () {
            var jsfile = new Buffer.concat(chunks);
            response.header('content-type', 'application/pdf');
            response.send(jsfile);
        });
    }).on("error", function () {
        callback(null);
    });
});

app.get('/html', function (req, res) {
    fs.readFile(__dirname + '/tmp/' + req.query.id, 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        var obj = JSON.parse(data), hits = [], noHits = [], json, metaData, metaDataKeys = [];
        metaData = obj.metaData;
        for (var i = 0; i < metaData.data.length; i++) {
            metaDataKeys[metaData.data[i].f_table_name] = metaData.data[i];
        }
        for (var prop in obj.hits) {
            if (obj.hits.hasOwnProperty(prop)) {
                if (obj.hits[prop].hits > 0) {
                    hits.push(obj.hits[prop]);
                } else {
                    noHits.push(obj.hits[prop]);
                }
            }
        }
        json = {
            hits: hits,
            noHits: noHits,
            text: obj.text,
            dateTime: obj.dateTime,
            metaDataKeys: metaDataKeys,
            id: req.query.id,
            addr: addr
        };
        res.render('static', {layout: 'layout', json: json});
    });
});

app.post('/intersection', function (req, response) {
    if (!req.body.wkt) {
        response.status(400);
        response.send({
            success: false,
            message: "WKT is required"
        });
        return;
    }
    db = req.body.db;
    schema = req.body.schema;
    buffer = req.body.buffer;
    socketId = req.body.socketid;
    text = req.body.text;
    baseLayer = req.body.baselayer;
    layers = req.body.layers;
    var conString = "postgres://" + pgConfig.user + ":" + pgConfig.pw + "@" + pgConfig.host + "/" + db;
    var url = gc2Config.host + "/api/v1/meta/" + db + "/" + schema;
    var wkt = req.body.wkt;
    var buffer4326;
    var primitive = JSON.parse(terraformer.parse(wkt).toJson());
    if (buffer > 0) {
        var crss = {
            "EPSG:25832": "+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs",
            "EPSG:3857": "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs",
            "EPSG:4326": "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"
        };

        var reader = new jsts.io.GeoJSONParser();
        var writer = new jsts.io.GeoJSONWriter();

        var geom = reader.read(reproject.reproject(primitive, "EPSG:4326", "EPSG:25832", crss));
        buffer4326 = reproject.reproject(writer.write(geom.buffer(buffer)), "EPSG:25832", "EPSG:4326", crss);
    }
    fileName = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });

    // Start static map
    var postData = querystring.stringify({
        size: '700x500',
        baselayer: baseLayer,
        layers: layers,
        sql: "SELECT ST_GeomFromText('" + terraformer.convert(buffer4326) + "',4326)"
    });

    options = {
        method: 'POST',
        host: gc2Config.staticMapHost,
        port: 80,
        path: '/api/v1/staticmap/png/odder',
        encoding: null
    };

    var staticMapReq = http.request(options, function (res) {
        var imagedata = '';
        res.setEncoding('binary');

        res.on('data', function (chunk) {
            imagedata += chunk
        });

        res.on('end', function () {
            fs.writeFile(__dirname + "/public/tmp/" + fileName + ".png", imagedata, 'binary', function (err) {
                if (err) throw err;
                console.log('Image saved.')
            });
            io.emit(socketId, {static: true});
        });

        res.on('error', function () {
            console.log("Static map error");
            io.emit(socketId, {static: true});
        });

    });
    staticMapReq.write(postData);
    staticMapReq.end();

    pg.connect(conString, function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        request.get(url, function (err, res, body) {
            if (!err) {
                var metaData = JSON.parse(body), count = 0, table, sql, geomField, bindings, startTime, hits = {}, hit, metaDataFinal = {data: []};
                // Count layers
                for (var i = 0; i < metaData.data.length; i = i + 1) {
                    if (metaData.data[i].type !== "RASTER") {
                        metaDataFinal.data.push(metaData.data[i]);
                    }
                }

                (function iter() {
                    geomField = metaDataFinal.data[count].f_geometry_column;
                    table = metaDataFinal.data[count].f_table_schema + "." + metaDataFinal.data[count].f_table_name;
                    if (buffer > 0) {
                        sql = "SELECT geography(ST_transform(" + geomField + ",4326)) as _gc2_geom, * FROM " + table + " WHERE ST_DWithin(ST_GeogFromText($1), geography(ST_transform(" + geomField + ",4326)), $2);";
                        bindings = [wkt, buffer];
                    } else {
                        sql = "SELECT * FROM " + table + " WHERE ST_transform(" + geomField + ",900913) && ST_transform(ST_geomfromtext($1,4326),900913) AND ST_intersects(ST_transform(" + geomField + ",900913),ST_transform(ST_geomfromtext($1,4326),900913))";
                        bindings = [wkt];
                    }
                    startTime = new Date().getTime();
                    client.query(sql, bindings, function (err, result) {
                        var time = new Date().getTime() - startTime;
                        count++;

                        if (!err) {
                            hit = {
                                table: table,
                                hits: result.rows.length,
                                num: count + "/" + metaDataFinal.data.length,
                                time: time,
                                id: socketId,
                                error: null
                            };
                        } else {
                            hit = {
                                table: table,
                                hits: null,
                                num: null,
                                time: time,
                                id: socketId,
                                error: err.severity,
                                hint: err.hint
                            };
                        }
                        hits[table] = hit;
                        io.emit(socketId, hit);
                        if (metaDataFinal.data.length === count) {
                            client.end();
                            var report = {
                                hits: hits,
                                file: fileName,
                                geom: buffer4326 || primitive,
                                primitive: primitive,
                                text: text
                            };
                            response.send(report);
                            // Add meta data and date/time to report before writing to file
                            report.metaData = metaDataFinal;
                            report.dateTime = moment().format('MMMM Do YYYY, hh:mm');
                            fs.writeFile(__dirname + "/tmp/" + fileName, JSON.stringify(report, null, 4), function (err) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log("Repport saved");
                                }
                            });
                            return;
                        }
                        iter();
                    });

                })();
                //winston.log('info', resultsObj.message, resultsObj);
            } else {
                console.log("Ups");
                //winston.log('error', err);
            }
        });
    });
})
;
var server = app.listen(8080, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('App listening at http://%s:%s', host, port);
});
var io = require('socket.io')(server);
io.on('connection', function (socket) {
    console.log(socket.id);
});



