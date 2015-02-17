var request = require("request");
var express = require('express');
var cors = require('cors')
var app = express();
var pg = require('pg');
var conString = "postgres://postgres:1234@localhost/mydb";
var url = "http://localhost:8383/api/v1/meta/mydb/public";
var buffer = 0;
var socketId;

app.use(cors());
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/../index.html');
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
    var hits = {};
    pg.connect(conString, function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        request.get(url, function (err, res, body) {
            if (!err) {
                var metaData = JSON.parse(body), count = 0, table, sql, geomField, bindings;
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

                    client.query(sql, bindings, function (err, result) {
                        count++;
                        hits[table] = err || result.rows;
                        io.emit(socketId, {table: table, hits: hits[table].length, id: socketId});
                        if (metaData.data.length === count) {
                            console.log("Done!")
                            client.end();
                            response.send(hits);
                            io.emit(socketId, {message: "Done", id: socketId});
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
    console.log('Example app listening at http://%s:%s', host, port)
});
var io = require('socket.io')(server);
io.on('connection', function (socket) {
        console.log(socket.id);
        //io.sockets.connected[socket.id].emit(socket.id);
});


