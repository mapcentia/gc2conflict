var request = require("request");
var express = require('express');
var pg = require('pg');
var fs = require('fs');
var reproject = require('reproject');
var terraformer = require('terraformer-wkt-parser');
var jsts = require('jsts');
var path = require('path');
var bodyParser = require('body-parser');
var moment = require('moment');
var nodeConfig = require('./config/nodeConfig');
var http = require('http');
var querystring = require('querystring');
var exec = require('child_process').exec;

var app = express();
// Set locale for date/time string
moment.locale("da");
app.use(bodyParser.urlencoded({extended: true, limit: '50mb'}));
app.use(bodyParser.json({extended: true, limit: '50mb'}));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/geoserver', function (req, response) {
    var url = "http://" + nodeConfig.print.host + ":" + nodeConfig.print.port + "/geoserver/pdf/info.json?var=printConfig";
    http.get(url, function (res) {
        var chunks = [];
        res.on('data', function (chunk) {
            chunks.push(chunk);
        });
        res.on("end", function () {
            var jsfile = new Buffer.concat(chunks);
            response.header('content-type', 'text/javascript');
            response.send(jsfile);
        });
    }).on("error", function () {
        callback(null);
    });
});
app.get('/static', function (req, response) {
    response.setHeader('Content-Type', 'application/json');
    response.sendFile(__dirname + '/tmp/' + req.query.id);
});
app.get('/pdf', function (req, response) {
    var url = "http://localhost:8080/?url=127.0.0.1:80/html?id=" + req.query.id;
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
app.post('/geomatic', function (req, response) {
    console.log(terraformer.convert(req.body.json));
    var postData = "wkt=" + terraformer.convert(req.body.json) + "&Username=" + nodeConfig.geomatic.user + "&Password=" + nodeConfig.geomatic.pw, id = req.body.id,
        options = {
            method: 'POST',
            host: "apps.conzoom.eu",
            port: "80",
            path: '/analysis/86F8A64F-1E22-4970-AD58-C808763CF61F/restreport/Pdf',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded ',
                'Content-Length': postData.length
            }
        },
        reqGeomatic = http.request(options, function (res) {
            var chunks = [];
            res.on('data', function (chunk) {
                chunks.push(chunk);
            });
            res.on('end', function () {
                var jsfile = new Buffer.concat(chunks);
                fs.writeFile(__dirname + "/public/tmp/geomatic_" + id + ".pdf", jsfile, 'binary', function (err) {
                    if (err) throw err;
                    console.log('Geomatic PDF saved.');
                });
                response.send({success: true});
            });
        });
    reqGeomatic.write(postData);
    reqGeomatic.end();
});
app.get('/html', function (req, res) {
    var addr;
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
app.post('/print', function (req, response) {
    var postData = JSON.stringify(req.body.json), id = req.body.id,
        options = {
            method: 'POST',
            host: nodeConfig.print.host,
            port: nodeConfig.print.port,
            path: '/geoserver/pdf/create.json',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        },
        staticMapReq = http.request(options, function (res) {
            var str = '';
            res.setEncoding('binary');
            res.on('data', function (chunk) {
                str += chunk
            });
            res.on('end', function () {
                http.get(JSON.parse(str).getURL, function (res) {
                    var chunks = [];
                    res.on('data', function (chunk) {
                        chunks.push(chunk);
                    });
                    res.on("end", function () {
                        var jsfile = new Buffer.concat(chunks);
                        fs.writeFile(__dirname + "/public/tmp/" + id + ".pdf", jsfile, 'binary', function (err) {
                            if (err) throw err;
                            console.log('PDF saved.');
                            exec("gs -dQUIET -dPARANOIDSAFER -dBATCH -dNOPAUSE -dNOPROMPT -sDEVICE=png16m -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -r190 -dFirstPage=1 -dLastPage=1 -sOutputFile=" + __dirname + "/public/tmp/" + id + ".png " + __dirname + "/public/tmp/" + id + ".pdf", function (error, stdout, stderr) {
                                if (error !== null) {
                                    console.log(error);
                                }
                                response.send({success: true});
                            });
                        });
                    });
                }).on("error", function () {
                    callback(null);
                });
            });
            res.on('error', function () {
                console.log("Static map error");
            });
        });
    staticMapReq.write(postData);
    staticMapReq.end();
});
app.post('/intersection', function (req, response) {
    var socketId, fileName, baseLayer, layers, buffer, db, schema, text;
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
    var conString = "postgres://" + nodeConfig.pg.user + ":" + nodeConfig.pg.pw + "@" + nodeConfig.pg.host + "/" + db;
    var url = "http://" + nodeConfig.host + "/api/v1/meta/" + db + "/" + schema;
    var wkt = req.body.wkt;
    var buffer4326 = null;
    var primitive = JSON.parse(terraformer.parse(wkt).toJson());
    if (buffer > 0) {
        // Get the UTM zone
        var log = primitive.bbox[0], lat = primitive.bbox[1],
            zoneNumber = Math.floor((log + 180) / 6) + 1;

        if (lat >= 56.0 && lat < 64.0 && log >= 3.0 && log < 12.0) {
            zoneNumber = 32;
        }
        //Special zones for Svalbard
        if (lat >= 72.0 && lat < 84.0) {
            if (log >= 0.0 && log < 9.0) {
                zoneNumber = 31;
            }
            else if (log >= 9.0 && log < 21.0) {
                zoneNumber = 33;
            }
            else if (log >= 21.0 && log < 33.0) {
                zoneNumber = 35;
            }
            else if (log >= 33.0 && log < 42.0) {
                zoneNumber = 37;
            }
        }
        console.log("Zone:" + zoneNumber);
        var crss = {
            "proj": "+proj=utm +zone=" + zoneNumber + " +ellps=WGS84 +datum=WGS84 +units=m +no_defs",
            "unproj": "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"
        };

        var reader = new jsts.io.GeoJSONParser();
        var writer = new jsts.io.GeoJSONWriter();

        var geom = reader.read(reproject.reproject(primitive, "unproj", "proj", crss));
        buffer4326 = reproject.reproject(writer.write(geom.buffer(buffer)), "proj", "unproj", crss);
    }
    fileName = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    pg.connect(conString, function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        request.get(url, function (err, res, body) {
            if (!err) {
                var metaData = JSON.parse(body), count = 0, table, sql, geomField, bindings, startTime, hits = {}, hit, metaDataFinal = {data: []}, metaDataKeys = [];
                // Count layers
                for (var i = 0; i < metaData.data.length; i = i + 1) {
                    if (metaData.data[i].type !== "RASTER" &&
                        metaData.data[i].baselayer !== true &&
                        metaData.data[i].skipconflict !== true) {
                        metaDataFinal.data.push(metaData.data[i]);
                        metaDataKeys[metaData.data[i].f_table_name] = metaData.data[i];
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
                        var time = new Date().getTime() - startTime, queryables, data = [], tmp = [];
                        count++;
                        if (!err) {
                            // Get values if queryable
                            queryables = JSON.parse(metaDataKeys[table.split(".")[1]].fieldconf);
                            for (var i = 0; i < result.rows.length; i++) {
                                for (var prop in queryables) {
                                    if (queryables.hasOwnProperty(prop)) {
                                        if (queryables[prop].conflict) {
                                            tmp.push({
                                                name: prop,
                                                alias: queryables[prop].alias || prop,
                                                value: result.rows[i][prop],
                                                sort_id: queryables[prop].sort_id,
                                                key: false
                                            })
                                        }
                                    }
                                }
                                if (tmp.length > 0) {
                                    tmp.push({
                                        name: metaDataKeys[table.split(".")[1]].pkey,
                                        alias: null,
                                        value: result.rows[i][metaDataKeys[table.split(".")[1]].pkey],
                                        sort_id: null,
                                        key: true
                                    });
                                    data.push(tmp);
                                }
                                tmp = [];
                            }
                            hit = {
                                table: table,
                                hits: result.rows.length,
                                data: data,
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
                console.log(err);
                //winston.log('error', err);
            }
        });
    });
});

var server = app.listen(80, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('App listening at http://%s:%s', host, port);
});
var io = require('socket.io')(server);
io.on('connection', function (socket) {
    console.log(socket.id);
});



