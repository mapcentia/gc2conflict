/*global geocloud:false */
/*global geocloud_host:false */
/*global $:false */
/*global jQuery:false */
/*global OpenLayers:false */
/*global ol:false */
/*global L:false */
/*global jRespond:false */
/*global Base64:false */
/*global array_unique:false */
/*global google:false */
/*global GeoExt:false */
/*global mygeocloud_ol:false */
/*global schema:false */
/*global document:false */
/*global window:false */
var Viewer, drawnItems;
Viewer = function () {
    "use strict";
    var init, switchLayer, setBaseLayer, addLegend, autocomplete, hostname, cloud, db, schema, uri, urlVars, hash, osm, qstore = [], permaLink, anchor, drawLayer, drawControl, zoomControl, metaDataKeys = [], metaDataKeysTitle = [], awesomeMarker, metaDataReady = false, settingsReady = false, nodeHost, makeConflict, socketId;
    hostname = geocloud_host;
    socketId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    uri = geocloud.pathName;
    hash = decodeURIComponent(geocloud.urlHash);
    db = "mydb";
    schema = "public";
    urlVars = geocloud.urlVars;
    nodeHost = "http://localhost:3000";
    switchLayer = function (name, visible) {
        if (visible) {
            cloud.showLayer(name);
        } else {
            cloud.hideLayer(name);
        }
        try {
            //history.pushState(null, null, permaLink());
        } catch (e) {
        }
        addLegend();
    };
    setBaseLayer = function (str) {
        cloud.setBaseLayer(str);
        addLegend();
        try {
            //history.pushState(null, null, permaLink());
        } catch (e) {
        }
    };
    addLegend = function () {
        var param = 'l=' + cloud.getVisibleLayers(true);
        $.ajax({
            url: hostname + '/api/v1/legend/json/' + db + '/?' + param,
            dataType: 'jsonp',
            jsonp: 'jsonp_callback',
            success: function (response) {
                var list = $("<ul/>"), li, classUl, title, className;
                $.each(response, function (i, v) {
                    try {
                        title = metaDataKeys[v.id.split(".")[1]].f_table_title;
                    }
                    catch (e) {
                    }
                    var u, showLayer = false;
                    if (typeof v === "object") {
                        for (u = 0; u < v.classes.length; u = u + 1) {
                            if (v.classes[u].name !== "") {
                                showLayer = true;
                            }
                        }
                        if (showLayer) {
                            li = $("<li/>");
                            classUl = $("<ul/>");
                            for (u = 0; u < v.classes.length; u = u + 1) {
                                if (v.classes[u].name !== "" || v.classes[u].name === "_gc2_wms_legend") {
                                    className = (v.classes[u].name !== "_gc2_wms_legend") ? "<span class='legend-text'>" + v.classes[u].name + "</span>" : "";
                                    classUl.append("<li><img class='legend-img' src='data:image/png;base64, " + v.classes[u].img + "' />" + className + "</li>");
                                }
                            }
                            // title
                            list.append($("<li>" + title + "</li>"));
                            list.append(li.append(classUl));

                        }

                    }
                });
                $('#legend').html(list);
            }
        });
    };

    permaLink = function () {
        return "/apps/viewer/" + db + "/" + schema + "/" + (typeof urlVars.i === "undefined" ? "" : "?i=" + urlVars.i.split("#")[0]) + anchor();
    };

    anchor = function () {
        var p = geocloud.transformPoint(cloud.getCenter().x, cloud.getCenter().y, "EPSG:900913", "EPSG:4326");
        return "#" + cloud.getBaseLayerName() + "/" + Math.round(cloud.getZoom()).toString() + "/" + (Math.round(p.x * 10000) / 10000).toString() + "/" + (Math.round(p.y * 10000) / 10000).toString() + "/" + ((cloud.getNamesOfVisibleLayers()) ? cloud.getNamesOfVisibleLayers().split(",").reverse().join(",") : "");
    };
    autocomplete = new google.maps.places.Autocomplete(document.getElementById('search-input'));
    google.maps.event.addListener(autocomplete, 'place_changed', function () {
        var place = autocomplete.getPlace(),
            center = new geocloud.transformPoint(place.geometry.location.lng(), place.geometry.location.lat(), "EPSG:4326", "EPSG:900913");
        cloud.zoomToPoint(center.x, center.y, 18);
        if (awesomeMarker !== undefined) cloud.map.removeLayer(awesomeMarker);
        awesomeMarker = L.marker([place.geometry.location.lat(), place.geometry.location.lng()], {
            icon: L.AwesomeMarkers.icon({
                icon: 'home',
                markerColor: 'blue',
                prefix: 'fa'
            })
        }).addTo(cloud.map);
    });
    cloud = new geocloud.map({
        el: "map",
        zoomControl: false
    });
    zoomControl = L.control.zoom({
        position: 'bottomright'
    });
    cloud.map.addControl(zoomControl);

    // Start of draw
    cloud.map.on('draw:created', function (e) {
        drawLayer = e.layer;
        drawnItems.addLayer(drawLayer);
    });
    cloud.map.on('draw:drawstart', function (e) {
        clearDrawItems();
    });
    cloud.map.on('draw:drawstop', function (e) {
        var geoJSON = geoJSONFromDraw();
        makeConflict(geoJSON[0], geoJSON[1]);
    });
    cloud.map.on('draw:editstop', function (e) {
        var geoJSON = geoJSONFromDraw();
        makeConflict(geoJSON[0], geoJSON[1]);
    });
    drawnItems = new L.FeatureGroup();
    drawControl = new L.Control.Draw({
        position: 'bottomright',
        draw: {
            polygon: {
                title: 'Draw a polygon!',
                allowIntersection: false,
                drawError: {
                    color: '#b00b00',
                    timeout: 1000
                },
                shapeOptions: {
                    color: '#bada55'
                },
                showArea: true
            },
            polyline: {
                metric: true
            },
            circle: {
                shapeOptions: {
                    color: '#662d91'
                }
            }
        },
        edit: {
            featureGroup: drawnItems
        }
    });
    cloud.map.addLayer(drawnItems);
    cloud.map.addControl(drawControl);

    var clearDrawItems = function () {
        drawnItems.clearLayers();
    };

    var geoJSONFromDraw = function () {
        var layer, buffer = 0;
        for (var prop in drawnItems._layers) {
            layer = drawnItems._layers[prop];
            break;
        }
        if (typeof layer._mRadius !== "undefined") {
            buffer = buffer + layer._mRadius;
        }
        return [layer.toGeoJSON(), buffer];
    };
    makeConflict = function (geoJSON, buffer) {
        var wkt;
        //L.geoJson(geoJSON).addTo(cloud.map);
        wkt = Terraformer.WKT.convert(geoJSON.geometry);
        $.ajax({
            url: nodeHost + "/intersection?wkt=" + wkt + "&buffer=" + buffer + "&socketid=" + socketId,
            //dataType: 'jsonp',
            //jsonp: 'jsonp_callback',
            success: function (response) {
                //console.log(response);
                var hitsTable = $("#hits-content tbody"),
                    noHitsTable = $("#nohits-content tbody"),
                    errorTable = $("#error-content tbody"), row;
                hitsTable.empty();
                noHitsTable.empty();
                errorTable.empty();
                $('#main-tabs a[href="#result-content"]').tab('show')
                $.each(response, function (i, v) {
                        if (typeof v.name === "undefined") {
                            row = "<tr><td>" + i + "</td><td>" + v.length + "</td></tr>";
                            if (v.length > 0) {
                                hitsTable.append(row)
                                //console.log($.parseJSON(v[0].gc2_geom))
                                //L.geoJson($.parseJSON(v[0].gc2_geom)).addTo(cloud.map);
                            } else {
                                noHitsTable.append(row)
                            }
                        } else {
                            row = "<tr><td>" + i + "</td><td>" + v.severity + "</td></tr>";
                            errorTable.append(row)

                        }
                    }
                )
            }
        }); // Ajax call end
    };

// Draw end
    init = function () {
        var metaData, layers = {}, extent = null, i,
            socket = io.connect(nodeHost);
        console.log(socketId);
        socket.on(socketId, function (data) {
            console.log(data);
            $("#console").append(data.table + ": " + data.hits + "\n");
        });
        if (typeof window.setBaseLayers !== 'object') {
            window.setBaseLayers = [
                {"id": "mapQuestOSM", "name": "MapQuset OSM"},
                {"id": "osm", "name": "OSM"},
                {"id": "stamenToner", "name": "Stamen toner"}
            ];
        }
        cloud.bingApiKey = window.bingApiKey;
        cloud.digitalGlobeKey = window.digitalGlobeKey;
        for (i = 0; i < window.setBaseLayers.length; i = i + 1) {
            if (typeof window.setBaseLayers[i].restrictTo === "undefined" || window.setBaseLayers[i].restrictTo.indexOf(schema) > -1) {
                cloud.addBaseLayer(window.setBaseLayers[i].id, window.setBaseLayers[i].db);
                $("#base-layer-list").append(
                    "<li><a href=\"javascript:void(0)\" onclick=\"MapCentia.setBaseLayer('" + window.setBaseLayers[i].id + "')\">" + window.setBaseLayers[i].name + "</a></li>"
                );
            }
        }

        $("#locate-btn").on("click", function () {
            cloud.locate();
        });
        $("#clear-btn").on("click", function () {
            clearDrawItems();
        });

        $("#modal-info").on('hidden.bs.modal', function (e) {
            $.each(qstore, function (i, v) {
                qstore[i].reset();
            });
        });
        $.ajax({
            url: geocloud_host.replace("cdn.", "") + '/api/v1/meta/' + db + '/' + (window.gc2Options.mergeSchemata === null ? "" : window.gc2Options.mergeSchemata.join(",") + ',') + (typeof urlVars.i === "undefined" ? "" : urlVars.i.split("#")[0] + ',') + schema,
            dataType: 'jsonp',
            scriptCharset: "utf-8",
            jsonp: 'jsonp_callback',
            success: function (response) {
                var base64name, authIcon, isBaseLayer, arr, groups, i, l, cv;
                groups = [];
                metaData = response;
                for (i = 0; i < metaData.data.length; i++) {
                    metaDataKeys[metaData.data[i].f_table_name] = metaData.data[i];
                    (metaData.data[i].f_table_title) ? metaDataKeysTitle[metaData.data[i].f_table_title] = metaData.data[i] : null;
                }

                for (i = 0; i < response.data.length; ++i) {
                    groups[i] = response.data[i].layergroup;
                }
                arr = array_unique(groups).reverse();
                for (var u = 0; u < response.data.length; ++u) {
                    if (response.data[u].baselayer) {
                        isBaseLayer = true;
                    } else {
                        isBaseLayer = false;
                    }
                    layers[[response.data[u].f_table_schema + "." + response.data[u].f_table_name]] = cloud.addTileLayers({
                        layers: [response.data[u].f_table_schema + "." + response.data[u].f_table_name],
                        db: db,
                        isBaseLayer: isBaseLayer,
                        tileCached: true,
                        visibility: false,
                        wrapDateLine: false,
                        displayInLayerSwitcher: true,
                        name: response.data[u].f_table_name
                    });
                }
                for (i = 0; i < arr.length; ++i) {
                    if (arr[i] && arr[i] !== "Master" && arr[i] !== "Default group") {
                        l = [];
                        cv = ( typeof (metaDataKeysTitle[arr[i]]) === "object") ? metaDataKeysTitle[arr[i]].f_table_name : null;
                        base64name = Base64.encode(arr[i]).replace(/=/g, "");
                        $("#layers").append('<div class="panel panel-default"><div class="panel-heading" role="tab"><h4 class="panel-title"><a class="accordion-toggle" data-toggle="collapse" data-parent="#layers" href="#collapse' + base64name + '"> ' + arr[i] + ' </a></h4></div><ul class="list-group" id="group-' + base64name + '" role="tabpanel"></ul></div>');
                        $("#group-" + base64name).append('<div id="collapse' + base64name + '" class="accordion-body collapse"></div>');
                        response.data.reverse();
                        for (u = 0; u < response.data.length; ++u) {
                            if (response.data[u].layergroup == arr[i]) {
                                var text = (response.data[u].f_table_title === null || response.data[u].f_table_title === "") ? response.data[u].f_table_name : response.data[u].f_table_title;
                                $("#collapse" + base64name).append('<li class="list-group-item"><span class="checkbox"><label><input type="checkbox" id="' + response.data[u].f_table_name + '" data-gc2-id="' + response.data[u].f_table_schema + "." + response.data[u].f_table_name + '">' + text + '</label></span></li>');
                                l.push({
                                    text: (response.data[u].f_table_title === null || response.data[u].f_table_title === "") ? response.data[u].f_table_name : response.data[u].f_table_title,
                                    id: response.data[u].f_table_schema + "." + response.data[u].f_table_name,
                                    leaf: true,
                                    checked: false
                                });
                            }
                        }
                    }
                }
                metaDataReady = true;
                // Bind switch layer event
                $(".checkbox input[type=checkbox]").change(function (e) {
                    switchLayer($(this).data('gc2-id'), $(this).context.checked);
                    e.stopPropagation();
                })
            }
        }); // Ajax call end
        $.ajax({
            url: geocloud_host.replace("cdn.", "") + '/api/v1/setting/' + db,
            dataType: 'jsonp',
            jsonp: 'jsonp_callback',
            success: function (response) {
                if (typeof response.data.extents === "object") {
                    if (typeof response.data.extents[schema] === "object") {
                        extent = response.data.extents[schema];
                    }
                }
                settingsReady = true;
            }
        }); // Ajax call end

        //Set up the state from the URI
        (function pollForLayers() {
            if (metaDataReady && settingsReady) {
                var p, arr, i, hashArr;
                hashArr = hash.replace("#", "").split("/");
                if (hashArr[0]) {
                    $(".base-map-button").removeClass("active");
                    $("#" + hashArr[0]).addClass("active");
                    if (hashArr[1] && hashArr[2] && hashArr[3]) {
                        setBaseLayer(hashArr[0]);
                        if (hashArr[4]) {
                            arr = hashArr[4].split(",");
                            for (i = 0; i < arr.length; i++) {
                                switchLayer(arr[i], true);
                                $("#" + arr[i].replace(schema + ".", "")).attr('checked', true);
                                $('*[data-gc2-id="' + arr[i] + '"]').attr('checked', true);
                            }
                        }
                        p = geocloud.transformPoint(hashArr[2], hashArr[3], "EPSG:4326", "EPSG:900913");
                        cloud.zoomToPoint(p.x, p.y, hashArr[1]);
                    }
                } else {
                    setBaseLayer(window.setBaseLayers[0].id);
                    if (extent !== null) {
                        cloud.zoomToExtent(extent);
                    } else {
                        cloud.zoomToExtent();
                    }
                }
            } else {
                setTimeout(pollForLayers, 10);
            }
        }());
        var moveEndCallBack = function () {
            try {
                // history.pushState(null, null, permaLink());
            }
            catch (e) {
            }
        };
        cloud.on("dragend", moveEndCallBack);
        cloud.on("moveend", moveEndCallBack);
        var clicktimer;
        cloud.on("dblclick", function (e) {
            clicktimer = undefined;
        });
        cloud.on("click", function (e) {
            var layers, count = 0, hit = false, event = new geocloud.clickEvent(e, cloud), distance;
            if (clicktimer) {
                clearTimeout(clicktimer);
            }
            else {
                clicktimer = setTimeout(function (e) {
                    clicktimer = undefined;
                    var coords = event.getCoordinate();
                    $.each(qstore, function (index, store) {
                        store.reset();
                        cloud.removeGeoJsonStore(store);
                    });
                    layers = cloud.getVisibleLayers().split(";");
                    $("#info-tab").empty();
                    $("#info-pane").empty();
                    $.each(layers, function (index, value) {
                        if (layers[0] === "") {
                            return false;
                        }
                        var isEmpty = true;
                        var srid = metaDataKeys[value.split(".")[1]].srid;
                        var geoType = metaDataKeys[value.split(".")[1]].type;
                        var layerTitel = (metaDataKeys[value.split(".")[1]].f_table_title !== null && metaDataKeys[value.split(".")[1]].f_table_title !== "") ? metaDataKeys[value.split(".")[1]].f_table_title : metaDataKeys[value.split(".")[1]].f_table_name;
                        var not_querable = metaDataKeys[value.split(".")[1]].not_querable;
                        var versioning = metaDataKeys[value.split(".")[1]].versioning;
                        if (geoType !== "POLYGON" && geoType !== "MULTIPOLYGON") {
                            var res = [156543.033928, 78271.516964, 39135.758482, 19567.879241, 9783.9396205,
                                4891.96981025, 2445.98490513, 1222.99245256, 611.496226281, 305.748113141, 152.87405657,
                                76.4370282852, 38.2185141426, 19.1092570713, 9.55462853565, 4.77731426782, 2.38865713391,
                                1.19432856696, 0.597164283478, 0.298582141739, 0.149291];
                            distance = 5 * res[cloud.getZoom()];
                        }
                        qstore[index] = new geocloud.sqlStore({
                            db: db,
                            id: index,
                            onLoad: function () {
                                var layerObj = qstore[this.id], out = [], fieldLabel;
                                isEmpty = layerObj.isEmpty();
                                if (!isEmpty && !not_querable) {
                                    $('#modal-info-body').show();
                                    var fieldConf = $.parseJSON(metaDataKeys[value.split(".")[1]].fieldconf);
                                    $("#info-tab").append('<li><a data-toggle="tab" href="#_' + index + '">' + layerTitel + '</a></li>');
                                    $("#info-pane").append('<div class="tab-pane" id="_' + index + '"><button type="button" class="btn btn-primary btn-xs" data-gc2-store="' + index + '">Søg med dette objekt</button><table class="table table-condensed"><thead><tr><th>' + __("Property") + '</th><th>' + __("Value") + '</th></tr></thead></table></div>');

                                    $.each(layerObj.geoJSON.features, function (i, feature) {
                                        if (fieldConf === null) {
                                            $.each(feature.properties, function (name, property) {
                                                out.push([name, 0, name, property]);
                                            });
                                        }
                                        else {
                                            $.each(fieldConf, function (name, property) {
                                                if (property.querable) {
                                                    fieldLabel = (property.alias !== null && property.alias !== "") ? property.alias : name;
                                                    if (feature.properties[name] !== undefined) {
                                                        if (property.link) {
                                                            out.push([name, property.sort_id, fieldLabel, "<a target='_blank' href='" + (property.linkprefix !== null ? property.linkprefix : "") + feature.properties[name] + "'>" + feature.properties[name] + "</a>"]);
                                                        }
                                                        else {
                                                            out.push([name, property.sort_id, fieldLabel, feature.properties[name]]);
                                                        }
                                                    }
                                                }
                                            });
                                        }
                                        out.sort(function (a, b) {
                                            return a[1] - b[1];
                                        });
                                        $.each(out, function (name, property) {
                                            $("#_" + index + " table").append('<tr><td>' + property[2] + '</td><td>' + property[3] + '</td></tr>');
                                        });
                                        out = [];
                                        $('#info-tab a:first').tab('show');
                                    });
                                    hit = true;
                                } else {
                                    layerObj.reset();
                                }
                                count++;
                                if (count === layers.length) {
                                    if (!hit) {
                                        $('#modal-info-body').hide();
                                    }
                                    $(".tab-pane button").click(function (e) {
                                        makeConflict(qstore[$(this).data('gc2-store')].geoJSON.features [0], 0);
                                    });
                                    $('#main-tabs a[href="#info-content"]').tab('show')
                                }
                            }
                        });
                        cloud.addGeoJsonStore(qstore[index]);
                        var sql, f_geometry_column = metaDataKeys[value.split(".")[1]].f_geometry_column;
                        if (geoType === "RASTER") {
                            sql = "SELECT foo.the_geom,ST_Value(rast, foo.the_geom) As band1, ST_Value(rast, 2, foo.the_geom) As band2, ST_Value(rast, 3, foo.the_geom) As band3 " +
                            "FROM " + value + " CROSS JOIN (SELECT ST_transform(ST_GeomFromText('POINT(" + coords.x + " " + coords.y + ")',3857)," + srid + ") As the_geom) As foo " +
                            "WHERE ST_Intersects(rast,the_geom) ";
                        } else {

                            if (geoType !== "POLYGON" && geoType !== "MULTIPOLYGON") {
                                sql = "SELECT * FROM " + value + " WHERE round(ST_Distance(ST_Transform(\"" + f_geometry_column + "\",3857), ST_GeomFromText('POINT(" + coords.x + " " + coords.y + ")',3857))) < " + distance;
                                if (versioning) {
                                    sql = sql + " AND gc2_version_end_date IS NULL";
                                }
                                sql = sql + " ORDER BY round(ST_Distance(ST_Transform(\"" + f_geometry_column + "\",3857), ST_GeomFromText('POINT(" + coords.x + " " + coords.y + ")',3857)))";
                            } else {
                                sql = "SELECT * FROM " + value + " WHERE ST_Intersects(ST_Transform(ST_geomfromtext('POINT(" + coords.x + " " + coords.y + ")',900913)," + srid + ")," + f_geometry_column + ")";
                                if (versioning) {
                                    sql = sql + " AND gc2_version_end_date IS NULL";
                                }
                            }
                        }
                        sql = sql + "LIMIT 5";
                        qstore[index].sql = sql;
                        qstore[index].load();
                    });
                }, 250);
            }
        });
    };
    return {
        init: init,
        cloud: cloud,
        setBaseLayer: setBaseLayer,
        schema: schema
    };
};