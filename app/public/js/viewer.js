/*global geocloud:false */
/*global geocloud_host:false */
/*global $:false */
/*global jQuery:false */
/*global L:false */
/*global Base64:false */
/*global array_unique:false */
/*global google:false */
/*global mygeocloud_ol:false */
/*global schema:false */
/*global document:false */
/*global window:false */
var Viewer, print;
Viewer = function () {
    "use strict";
    var BACKEND = "cartodb";
    L.drawLocal = {
        draw: {
            toolbar: {
                actions: {
                    title: __('Cancel drawing'),
                    text: __('Cancel')
                },
                undo: {
                    title: __('Delete last point drawn'),
                    text: __('Delete last point')
                },
                buttons: {
                    polyline: __('Search with a line'),
                    polygon: __('Search with an area'),
                    rectangle: __('Search with a rectangle'),
                    circle: __('Search with a circle'),
                    marker: __('Search with a point')
                }
            },
            handlers: {
                circle: {
                    tooltip: {
                        start: __('Click and drag to draw circle.')
                    },
                    radius: __('Radius')
                },
                marker: {
                    tooltip: {
                        start: __('Click map to place marker.')
                    }
                },
                polygon: {
                    tooltip: {
                        start: __('Click to start drawing shape.'),
                        cont: __('Click to continue drawing shape.'),
                        end: __('Click first point to close this shape.')
                    }
                },
                polyline: {
                    error: __('<strong>Error:</strong> shape edges cannot cross!'),
                    tooltip: {
                        start: __('Click to start drawing line.'),
                        cont: __('Click to continue drawing line.'),
                        end: __('Click last point to finish line.')
                    }
                },
                rectangle: {
                    tooltip: {
                        start: __('Click and drag to draw rectangle.')
                    }
                },
                simpleshape: {
                    tooltip: {
                        end: __('Release mouse to finish drawing.')
                    }
                }
            }
        },
        edit: {
            toolbar: {
                actions: {
                    save: {
                        title: __('Save changes.'),
                        text: __('Save')
                    },
                    cancel: {
                        title: __('Cancel editing, discards all changes.'),
                        text: __('Cancel')
                    }
                },
                buttons: {
                    edit: __("Edit drawings."),
                    editDisabled: __('No drawings to edit.'),
                    remove: __('Delete drawings.'),
                    removeDisabled: __('No drawings to delete.')
                }
            },
            handlers: {
                edit: {
                    tooltip: {
                        text: __('Drag handles, or marker to edit drawing.'),
                        subtext: __('Click cancel to undo changes.')
                    }
                },
                remove: {
                    tooltip: {
                        text: __('Click on a feature to remove')
                    }
                }
            }
        }
    };

    var init, switchLayer, setBaseLayer, addLegend, autocomplete, hostname, cloud, db, schema, hash, osm, qstore = [], anchor, drawLayer, drawControl, zoomControl, metaDataKeys = [], metaDataKeysTitle = [], awesomeMarker, metaDataReady = false, settingsReady = false, makeConflict, socketId, drawnItems = new L.FeatureGroup(), infoItems = new L.FeatureGroup(), bufferItems = new L.FeatureGroup(), dataItems = new L.FeatureGroup(), drawing = false, searchFinish, zoomToFeature, fileId, geomStr, urlVars;
    hostname = window.browserConfig.host;
    socketId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    hash = decodeURIComponent(geocloud.urlHash);
    urlVars = geocloud.urlVars;
    db = urlVars.db;
    schema = urlVars.schema;
    switchLayer = function (name, visible) {
        if (visible) {
            cloud.showLayer(name);
            $('*[data-gc2-id="' + name + '"]').prop('checked', true);
        } else {
            cloud.hideLayer(name);
            $('*[data-gc2-id="' + name + '"]').prop('checked', false);
        }
        addLegend();
    };
    setBaseLayer = function (str) {
        cloud.setBaseLayer(str);
        addLegend();
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
                            list.append($("<li>" + title + "</li>"));
                            list.append(li.append(classUl));
                        }
                    }
                });
                $('#legend').html(list);
            }
        });
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
        zoomControl: false,
        numZoomLevels: 21
    });
    cloud.map.setView([0, 0], 1);
    zoomControl = L.control.zoom({
        position: 'topright'
    });
    cloud.map.addControl(zoomControl);
    cloud.map.addLayer(drawnItems);
    cloud.map.addLayer(infoItems);
    cloud.map.addLayer(bufferItems);
    cloud.map.addLayer(dataItems);

    print = L.print.provider({
        capabilities: window.printConfig,
        method: 'POST',
        dpi: 127,
        outputFormat: 'pdf',
        legends: false,
        proxy: '/cgi/proxy.cgi?url=',
        customParams: {
            "mapTitle": "",
            "mapComment": "",
            "mapFooter": "",
            mapAttribution: ""
        }
    });
    cloud.map.addControl(L.control.print({
        provider: print,
        position: 'topright'
    }));

    // Start of draw
    cloud.map.on('draw:created', function (e) {
        drawLayer = e.layer;
        drawnItems.addLayer(drawLayer);
    });
    cloud.map.on('draw:drawstart', function (e) {
        clearDrawItems();
        clearInfoItems();
        clearDataItems();
        drawing = true;
    });
    cloud.map.on('draw:drawstop', function (e) {
        var geoJSON = geoJSONFromDraw();
        if (geoJSON) {
            makeConflict(geoJSON[0], geoJSON[1], false, __("From drawing"));
            drawing = false;
        }
    });
    cloud.map.on('draw:editstop', function (e) {
        var geoJSON = geoJSONFromDraw();
        if (geoJSON) {
            makeConflict(geoJSON[0], geoJSON[1], false, __("From drawing"));
            drawing = false;
        }
    });
    cloud.map.on('draw:editstart', function (e) {
        drawing = true;
    });
    drawControl = new L.Control.Draw({
        position: 'topright',
        draw: {
            polygon: {
                allowIntersection: false,
                drawError: {
                    color: '#b00b00',
                    timeout: 1000
                },
                shapeOptions: {
                    color: '#662d91'
                },
                showArea: true
            },
            polyline: false,
            circle: {
                shapeOptions: {
                    color: '#662d91'
                }
            },
            rectangle: {
                shapeOptions: {
                    color: '#662d91'
                }
            },
            marker: browserConfig.enableMarkerDraw
        },
        edit: {
            featureGroup: drawnItems,
            remove: false
        }
    });
    cloud.map.addControl(drawControl);

    var clearDrawItems = function () {
        drawnItems.clearLayers();
        clearBufferItems();
    };

    var clearInfoItems = function () {
        infoItems.clearLayers();
        clearBufferItems();
        $("#info-tab").empty();
        $("#info-pane").empty();
        $('#modal-info-body').hide();
    };

    var clearBufferItems = function () {
        bufferItems.clearLayers();
    };
    var clearDataItems = function () {
        dataItems.clearLayers();
    };

    var clearAllItems = function () {
        clearDrawItems();
        clearInfoItems();
        clearDataItems();
    };

    var geoJSONFromDraw = function () {
        var layer, buffer = 0;
        for (var prop in drawnItems._layers) {
            layer = drawnItems._layers[prop];
            break;
        }
        if (typeof layer === "undefined") {
            return;
        }
        if (typeof layer._mRadius !== "undefined") {
            if (typeof layer._mRadius !== "undefined") {
                buffer = buffer + layer._mRadius;
            }
        }
        return [layer.toGeoJSON(), buffer];
    };

    var showPrintBtn = function () {
        $('#print-btn').removeAttr("disabled");
        $("#print-btn .print-spinner").hide();
        searchFinish = false;

    };
    var showGeomaticBtn = function () {
        $('#geomatic-btn').removeAttr("disabled");
        $("#geomatic-btn .print-spinner").hide();
        searchFinish = false;
    };
    makeConflict = function (geoJSON, buffer, zoomToBuffer, text) {
        var bufferFromForm = $("#buffer").val(), showBuffer = false, visibleLayers, baseLayer;
        if ($.isNumeric(bufferFromForm)) {
            buffer = Number(buffer) + Number(bufferFromForm);
            showBuffer = true;
        } else if (!$.isNumeric(bufferFromForm) && bufferFromForm !== "") {
            alert("Buffer skal være et tal.");
            return false;
        }
        visibleLayers = cloud.getVisibleLayers().split(";");
        baseLayer = cloud.getBaseLayerName().toUpperCase();
        var hitsTable = $("#hits-content tbody"),
            noHitsTable = $("#nohits-content tbody"),
            errorTable = $("#error-content tbody"),
            hitsData = $("#hits-data"),
            row;

        hitsTable.empty();
        noHitsTable.empty();
        errorTable.empty();
        hitsData.empty();
        clearBufferItems();
        $("#spinner span").show();
        $(".print-spinner").show();
        $('#result .btn').attr('disabled', true);
        $.ajax({
            url: "/intersection",
            data: "db=" + db +
            "&schema=" + schema +
            "&wkt=" + Terraformer.WKT.convert(geoJSON.geometry) +
            "&baselayer=" + baseLayer +
            "&layers=" + visibleLayers.join(",") +
            "&buffer=" + buffer +
            "&socketid=" + socketId +
            "&text=" + encodeURIComponent(text),
            method: "POST",
            success: function (response) {
                var hitsCount = 0, noHitsCount = 0, errorCount = 0;
                $("#spinner span").hide();
                $("#result-origin").html(response.text);
                $('#main-tabs a[href="#result-content"]').tab('show');
                $('#result-content a[href="#hits-content"]').tab('show');
                $('#result .btn:first-child').attr("href", "/html?id=" + response.file)
                fileId = response.file;
                searchFinish = true;
                showPrintBtn();
                showGeomaticBtn();
                $.each(response.hits, function (i, v) {
                        var table = i.split(".")[1], table1, table2, tr, td,
                            title = (typeof metaDataKeys[table].f_table_title !== "undefined" && metaDataKeys[table].f_table_title !== "" && metaDataKeys[table].f_table_title !== null) ? metaDataKeys[table].f_table_title : table;
                        if (v.error === null) {
                            if (metaDataKeys[table].meta_url) {
                                title = "<a target='_blank' href='" + metaDataKeys[table].meta_url + "'>" + title + "</a>";
                            }
                            row = "<tr><td>" + title + "</td><td>" + v.hits + "</td><td><input type='checkbox' data-gc2-id='" + i + "' " + ($.inArray(i, visibleLayers) > -1 ? "checked" : "") + "></td></tr>";
                            if (v.hits > 0) {
                                hitsTable.append(row);
                                hitsCount++;
                                if (v.data.length > 0) {
                                    table1 = $("<table class='table table-data'/>");
                                    hitsData.append("<h3>" + title + " (" + v.data.length + ")</h3>");
                                    $.each(v.data, function (u, row) {
                                        var key = null, fid = null;
                                        tr = $("<tr/>");
                                        td = $("<td/>");
                                        table2 = $("<table class='table'/>");
                                        $.each(row, function (n, field) {
                                            if (!field.key) {
                                                table2.append("<tr><td style='width: 100px'>" + field.alias + "</td><td>" + field.value + "</td></tr>")
                                            } else {
                                                key = field.name;
                                                fid = field.value;
                                            }
                                        });
                                        td.append(table2);
                                        tr.append("<td class=''><button type='button' class='btn btn-default btn-xs zoom-to-feature' data-gc2-sf-table='" + (BACKEND === "cartodb" ? v.sql : i) + "' data-gc2-sf-key='" + key + "' data-gc2-sf-fid='" + fid + "'>#" + (u + 1) + " <i class='fa fa-search'></i></button></td>");
                                        tr.append(td);
                                        table1.append(tr);
                                    });
                                    hitsData.append(table1);

                                } else {
                                    //Pass
                                }
                            } else {
                                noHitsTable.append(row);
                                noHitsCount++;
                            }
                        } else {
                            row = "<tr><td>" + title + "</td><td>" + v.error + "</td></tr>";
                            errorTable.append(row);
                            errorCount++;
                        }
                        $('#result-content a[href="#hits-content"] span').html(" (" + hitsCount + ")");
                        $('#result-content a[href="#nohits-content"] span').html(" (" + noHitsCount + ")");
                        $('#result-content a[href="#error-content"] span').html(" (" + errorCount + ")");
                    }
                );
                $(".zoom-to-feature").click(function (e) {
                    zoomToFeature($(this).data('gc2-sf-table'), $(this).data('gc2-sf-key'), $(this).data('gc2-sf-fid'));
                    e.stopPropagation();
                });
                $("#result-content input[type=checkbox]").change(function (e) {
                    switchLayer($(this).data('gc2-id'), $(this).context.checked);
                    e.stopPropagation();
                });
                var bufferGeom = L.geoJson(response.geom, {
                    "color": "#ff7800",
                    "weight": 1,
                    "opacity": 0.65,
                    "dashArray": '5,3'
                });
                if (showBuffer) {
                    bufferGeom.addTo(bufferItems);
                }
                if (zoomToBuffer) {
                    cloud.map.fitBounds(bufferGeom.getBounds());
                }
                geomStr = response.geom;
            }
        }); // Ajax call end
    };
    zoomToFeature = function (table, key, fid) {
        var store, onLoad = function () {
            clearDataItems();
            //clearInfoItems();
            dataItems.addLayer(this.layer);
            cloud.zoomToExtentOfgeoJsonStore(this);
        };
        switch (BACKEND) {
            case "gc2":
                store = new geocloud.geoJsonStore({
                    host: hostname,
                    db: db,
                    sql: "SELECT * FROM " + table + " WHERE " + key + "=" + fid,
                    onLoad: onLoad
                });
                break;
            case "cartodb":
                store = new geocloud.cartoDbStore({
                    db: db,
                    sql: "SELECT * FROM (" + table + ") as foo WHERE " + key + "=" + fid,
                    onLoad: onLoad
                });
                break;
        }
        store.load();
    };
// Draw end
    init = function (me) {
        createSearch(me);
        var metaData, layers = {}, extent = null, i,
            socket = io.connect();
        socket.on(socketId, function (data) {
            if (typeof data.num !== "undefined") {
                $("#progress").html(data.num);
                if (data.error === null) {
                    $("#console").append(data.num + " table: " + data.table + ", hits: " + data.hits + " , time: " + data.time + "\n");
                } else {
                    $("#console").append(data.table + " : " + data.error + "\n");
                }
            }
        });
        // Set the default buffer
        $("#buffer").val(browserConfig.defaultBuffer);
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
        $('#print-btn').on("click", function () {
            $(this).attr('disabled', true);
            $("#print-btn .print-spinner").show();
            $.ajax({
                url: "/print",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: JSON.stringify({
                    json: print.getJson({layout: "A4 Landscape"}),
                    id: fileId
                }),
                method: "POST",
                success: function () {
                    searchFinish = true;
                    showPrintBtn();
                    window.open("/html?id=" + fileId);
                }
            }); // Ajax call end
        });

        $("#geomatic-btn").on("click", function () {
            $(this).attr('disabled', true);
            $("#geomatic-btn .print-spinner").show();
            $.ajax({
                url: "/geomatic",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: JSON.stringify({
                    json: geomStr,
                    id: fileId
                }),
                method: "POST",
                success: function () {
                    searchFinish = true;
                    showGeomaticBtn();
                    window.open("/tmp/geomatic_" + fileId + ".pdf");
                }
            }); // Ajax call end
        });

        $("#remove-all-btn").on("click", function () {
            clearAllItems();
        });

        $("#mapclient-btn").on("click", function () {
            var center = cloud.getCenter(), zoom = cloud.getZoom(), req, layers = cloud.getVisibleLayers(true).split(";"),
                layerStrs = [];

            for (i = 0; i < layers.length; i = i + 1) {
                if (layers[i] !== "") {
                    layerStrs.push("map_visibility_" + layers[i] + "=true");
                }
            }
            req = "map_x=" + center.x + "&map_y=" + center.y + "&map_zoom=" + zoom + "&" + layerStrs.join("&");
            window.open(hostname + "/apps/mapclient/" + db + "/" + schema + "?" + req);
        });

        if (typeof window.browserConfig.enableGeomatic === "undefined" || window.browserConfig.enableGeomatic === false) {
            $("#geomatic-btn").hide();
        }

        $("#modal-info").on('hidden.bs.modal', function (e) {
            $.each(qstore, function (i, v) {
                qstore[i].reset();
            });
        });
        $.ajax({
            url: '/meta?db=' + db + '&schema=' + (window.gc2Options.mergeSchemata === null ? "" : window.gc2Options.mergeSchemata.join(",") + ',') + (typeof urlVars.i === "undefined" ? "" : urlVars.i.split("#")[0] + ',') + schema,
            scriptCharset: "utf-8",
            success: function (response) {
                var base64name, authIcon, isBaseLayer, arr, groups, i, l, cv, u;
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

                switch (BACKEND) {
                    case "gc2":
                        for (u = 0; u < response.data.length; ++u) {
                            isBaseLayer = response.data[u].baselayer ? true : false;
                            layers[[response.data[u].f_table_schema + "." + response.data[u].f_table_name]] = cloud.addTileLayers({
                                host: hostname,
                                layers: [response.data[u].f_table_schema + "." + response.data[u].f_table_name],
                                db: db,
                                isBaseLayer: isBaseLayer,
                                tileCached: true,
                                visibility: false,
                                wrapDateLine: false,
                                displayInLayerSwitcher: true,
                                name: response.data[u].f_table_name,
                                type: "tms"
                            });
                        }
                        break;

                    case "cartodb":
                        var j = 0, tmpData = response.data.slice(); // Clone the array for async adding of CartoDB layers
                        (function iter() {
                            cartodb.createLayer(cloud.map, {
                                user_name: db,
                                type: 'cartodb',
                                sublayers: [{
                                    sql: tmpData[j].sql,
                                    cartocss: tmpData[j].cartocss
                                }]
                            }).on('done', function (layer) {
                                layer.baseLayer = false;
                                layer.id = tmpData[j].f_table_schema + "." + tmpData[j].f_table_name;
                                cloud.addLayer(layer, tmpData[j].f_table_name);
                                j++;
                                if (j < tmpData.length) {
                                    iter();
                                } else {
                                    return null;
                                }
                            });
                        }());
                        break;
                }
                for (i = 0; i < arr.length; ++i) {
                    if (arr[i]) {
                        l = [];
                        cv = ( typeof (metaDataKeysTitle[arr[i]]) === "object") ? metaDataKeysTitle[arr[i]].f_table_name : null;
                        base64name = Base64.encode(arr[i]).replace(/=/g, "");
                        $("#layers").append('<div class="panel panel-default" id="layer-panel-' + base64name + '"><div class="panel-heading" role="tab"><h4 class="panel-title"><a class="accordion-toggle" data-toggle="collapse" data-parent="#layers" href="#collapse' + base64name + '"> ' + arr[i] + ' </a></h4></div><ul class="list-group" id="group-' + base64name + '" role="tabpanel"></ul></div>');
                        $("#group-" + base64name).append('<div id="collapse' + base64name + '" class="accordion-body collapse"></div>');
                        response.data.reverse();
                        for (u = 0; u < response.data.length; ++u) {
                            if (response.data[u].layergroup == arr[i]) {
                                var text = (response.data[u].f_table_title === null || response.data[u].f_table_title === "") ? response.data[u].f_table_name : response.data[u].f_table_title;
                                if (response.data[u].baselayer) {
                                    $("#base-layer-list").append(
                                        "<li><a href=\"javascript:void(0)\" onclick=\"MapCentia.setBaseLayer('" + response.data[u].f_table_schema + "." + response.data[u].f_table_name + "')\">" + text + "</a></li>"
                                    );
                                }
                                else {
                                    $("#collapse" + base64name).append('<li class="list-group-item"><span class="checkbox"><label><input type="checkbox" id="' + response.data[u].f_table_name + '" data-gc2-id="' + response.data[u].f_table_schema + "." + response.data[u].f_table_name + '">' + text + '</label></span></li>');
                                    l.push({});
                                }
                            }
                        }
                        // Remove the group if empty
                        if (l.length === 0) {
                            $("#layer-panel-" + base64name).remove();
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
            url: '/setting?db=' + db + '&schema=' + schema,
            scriptCharset: "utf-8",
            success: function (response) {
                if (typeof response.data.extents === "object") {
                    var firstSchema = schema.split(",").length > 1 ? schema.split(",")[0] : schema
                    if (typeof response.data.extents[firstSchema] === "object") {
                        extent = response.data.extents[firstSchema];
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
                        if (BACKEND === "cartodb") {
                            cloud.map.fitBounds(extent);
                        } else {
                            cloud.zoomToExtent(extent);
                        }
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
            if (drawing) {
                return;
            }
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
                    $("#info-content .alert").hide();
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
                        var cartoSql = metaDataKeys[value.split(".")[1]].sql;
                        if (geoType !== "POLYGON" && geoType !== "MULTIPOLYGON") {
                            var res = [156543.033928, 78271.516964, 39135.758482, 19567.879241, 9783.9396205,
                                4891.96981025, 2445.98490513, 1222.99245256, 611.496226281, 305.748113141, 152.87405657,
                                76.4370282852, 38.2185141426, 19.1092570713, 9.55462853565, 4.77731426782, 2.38865713391,
                                1.19432856696, 0.597164283478, 0.298582141739, 0.149291];
                            distance = 5 * res[cloud.getZoom()];
                        }
                        var onLoad = function () {
                            var layerObj = qstore[this.id], out = [], fieldLabel;
                            isEmpty = layerObj.isEmpty();
                            if (!isEmpty && !not_querable) {
                                $('#modal-info-body').show();
                                var fieldConf = $.parseJSON(metaDataKeys[value.split(".")[1]].fieldconf);
                                $("#info-tab").append('<li><a data-toggle="tab" href="#_' + index + '">' + layerTitel + '</a></li>');
                                $("#info-pane").append('<div class="tab-pane" id="_' + index + '"><button type="button" class="btn btn-primary btn-xs" data-gc2-title="' + layerTitel + '" data-gc2-store="' + index + '">' + __('Search with this object') + '</button><table class="table table-condensed"><thead><tr><th>' + __("Property") + '</th><th>' + __("Value") + '</th></tr></thead></table></div>');

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
                                $("#info-content button").click(function (e) {
                                    clearDrawItems();
                                    makeConflict(qstore[$(this).data('gc2-store')].geoJSON.features [0], 0, false, __("From object in layer") + ": " + $(this).data('gc2-title'));
                                });
                                $('#main-tabs a[href="#info-content"]').tab('show');
                                clearDrawItems();
                            }
                        };

                        switch (BACKEND) {
                            case "gc2":
                                qstore[index] = new geocloud.sqlStore({
                                    host: hostname,
                                    db: db,
                                    clickable: false,
                                    id: index,
                                    onLoad: onLoad
                                });
                                break;
                            case "cartodb":
                                qstore[index] = new geocloud.cartoDbStore({
                                    host: hostname,
                                    db: db,
                                    clickable: false,
                                    id: index,
                                    onLoad: onLoad
                                });
                                break;
                        }
                        //cloud.addGeoJsonStore(qstore[index]);
                        infoItems.addLayer(qstore[index].layer);
                        var sql, f_geometry_column = metaDataKeys[value.split(".")[1]].f_geometry_column;
                        if (geoType === "RASTER") {
                            sql = "SELECT foo.the_geom,ST_Value(rast, foo.the_geom) As band1, ST_Value(rast, 2, foo.the_geom) As band2, ST_Value(rast, 3, foo.the_geom) As band3 " +
                            "FROM " + value + " CROSS JOIN (SELECT ST_transform(ST_GeomFromText('POINT(" + coords.x + " " + coords.y + ")',3857)," + srid + ") As the_geom) As foo " +
                            "WHERE ST_Intersects(rast,the_geom) ";
                        } else {

                            if (geoType !== "POLYGON" && geoType !== "MULTIPOLYGON") {
                                sql = "SELECT * FROM " + (BACKEND === "cartodb" ? "(" + cartoSql + ") as foo" : value) + " WHERE round(ST_Distance(ST_Transform(\"" + f_geometry_column + "\",3857), ST_GeomFromText('POINT(" + coords.x + " " + coords.y + ")',3857))) < " + distance;
                                if (versioning) {
                                    sql = sql + " AND gc2_version_end_date IS NULL ";
                                }
                                sql = sql + " ORDER BY round(ST_Distance(ST_Transform(\"" + f_geometry_column + "\",3857), ST_GeomFromText('POINT(" + coords.x + " " + coords.y + ")',3857)))";
                            } else {
                                sql = "SELECT * FROM " + (BACKEND === "cartodb" ? "(" + cartoSql + ") as foo" : value) + " WHERE ST_Intersects(ST_Transform(ST_geomfromtext('POINT(" + coords.x + " " + coords.y + ")',900913)," + srid + ")," + f_geometry_column + ")";
                                if (versioning) {
                                    sql = sql + " AND gc2_version_end_date IS NULL ";
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
        schema: schema,
        urlVars: urlVars,
        clearDrawItems: clearDrawItems,
        clearInfoItems: clearInfoItems,
        drawnItems: drawnItems,
        makeConflict: makeConflict
    };
};