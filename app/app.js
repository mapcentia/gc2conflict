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

var app = express();
var buffer = 0;
var socketId;
var db;
var schema;
var text;

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
            metaDataKeys: metaDataKeys
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
    pg.connect(conString, function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        request.get(url, function (err, res, body) {
            if (!err) {
                var metaData = JSON.parse(body), count = 0, table, sql, geomField, bindings, startTime, fileName, hits = {}, hit, layersCount = 0;
                // Count layers
                for (var i = 0; i < metaData.data.length; i = i + 1) {
                    if (metaData.data[i].type !== "RASTER"){
                        layersCount = layersCount + 1;
                    }
                }
                console.log(layersCount);

                (function iter() {
                    if (metaData.data[count].type !== "RASTER") {
                        geomField = metaData.data[count].f_geometry_column;
                        table = metaData.data[count].f_table_schema + "." + metaData.data[count].f_table_name;
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
                                    num: count + "/" + layersCount,
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
                            if (layersCount === count) {
                                fileName = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                                    return v.toString(16);
                                });
                                client.end();
                                var report = {
                                    hits: hits,
                                    file: fileName,
                                    geom: buffer4326 || primitive,
                                    text: text
                                };
                                response.send(report);
                                // Add meta data and date/time to report before writing to file
                                report.metaData = metaData;
                                report.dateTime = moment().format('MMMM Do YYYY, hh:mm');
                                fs.writeFile(__dirname + "/tmp/" + fileName, JSON.stringify(report, null, 4), function (err) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log("The file was saved!");
                                    }
                                });
                                return;
                            }
                            iter();
                        });
                    } else {
                        iter();
                    }
                })();
                //winston.log('info', resultsObj.message, resultsObj);
            } else {
                console.log("Ups")
                //winston.log('error', err);
            }
        });
    });
});
var server = app.listen(8080, function () {
    var host = server.address().address
    var port = server.address().port
    console.log('App listening at http://%s:%s', host, port);
});
var io = require('socket.io')(server);
io.on('connection', function (socket) {
    console.log(socket.id);
});



