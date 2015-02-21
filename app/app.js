var request = require("request");
var express = require('express');
var cors = require('cors')
var pg = require('pg');
var fs = require('fs');
var reproject = require('reproject');
var terraformer = require('terraformer-wkt-parser');
var jsts = require('jsts');
var path = require('path');

var app = express();
var buffer = 0;
var socketId;
var db;
var schema;

//app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/static', function (req, response) {
    response.setHeader('Content-Type', 'application/json');
    response.sendFile(__dirname + '/tmp/' + req.query.id);
});
app.get('/intersection', function (req, response) {
    if (!req.query.wkt) {
        response.status(400);
        response.send({
            success: false,
            message: "WKT is required"
        });
        return;
    }
    db = req.query.db;
    schema = req.query.schema;
    buffer = req.query.buffer;
    socketId = req.query.socketid;
    var conString = "postgres://postgres:1234@localhost/" + db;
    var url = "http://localhost:8383/api/v1/meta/" + db + "/" + schema;
    var wkt = req.query.wkt;
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
                var metaData = JSON.parse(body), count = 0, table, sql, geomField, bindings, startTime, fileName, hits = {}, hit;
                (function iter() {
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
                                num: count + "/" + metaData.data.length,
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
                        if (metaData.data.length === count) {
                            fileName = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                                return v.toString(16);
                            });
                            fs.writeFile(__dirname + "/tmp/" + fileName, JSON.stringify(hits, null, 4), function (err) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log("The file was saved!");
                                }
                            });
                            client.end();
                            response.send({
                                hits: hits,
                                file: fileName,
                                geom: buffer4326 || primitive
                            });
                            return;
                        }
                        iter();
                    });
                })();
                //winston.log('info', resultsObj.message, resultsObj);
            } else {
                console.log("Ups")
                //winston.log('error', err);
            }
        });
    });
});
var server = app.listen(3000, function () {
    var host = server.address().address
    var port = server.address().port
    console.log('App listening at http://%s:%s', host, port);
});
var io = require('socket.io')(server);
io.on('connection', function (socket) {
    console.log(socket.id);
});


