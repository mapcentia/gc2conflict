var request = require("request");
var express = require('express');
var cors = require('cors')
var pg = require('pg');
var fs = require('fs');

var app = express();
var conString = "postgres://postgres:1234@localhost/mydb";
var url = "http://localhost:8383/api/v1/meta/mydb/public";
var buffer = 0;
var socketId;

app.use(cors());
app.get('/', function (req, response) {
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
    buffer = req.query.buffer;
    socketId = req.query.socketid;
    var wkt = req.query.wkt;
    pg.connect(conString, function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        request.get(url, function (err, res, body) {
            if (!err) {
                var metaData = JSON.parse(body), count = 0, table, sql, geomField, bindings, startTime, fileName, hits = {}, hit;
                ;
                (function iter() {
                    geomField = metaData.data[count].f_geometry_column;
                    table = metaData.data[count].f_table_schema + "." + metaData.data[count].f_table_name;
                    if (buffer > 0) {
                        sql = "SELECT * FROM " + table + " WHERE ST_DWithin(ST_GeogFromText($1), geography(ST_transform(" + geomField + ",4326)), $2);";
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
                        }else{
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
                                file: fileName
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


