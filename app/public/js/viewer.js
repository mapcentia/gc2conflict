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
var Viewer;
Viewer = function () {
    "use strict";
    L.drawLocal = {
        draw: {
            toolbar: {
                actions: {
                    title: 'Afbryd tegning',
                    text: 'Afbryd'
                },
                undo: {
                    title: 'Slet sidste punkt tegnet.',
                    text: 'Slet sidste punkt'
                },
                buttons: {
                    polyline: 'Søg med en linje',
                    polygon: 'Søg med en flade',
                    rectangle: 'Søg med rektangel',
                    circle: 'Søg med en cirkel',
                    marker: 'Søg med et punkt'
                }
            },
            handlers: {
                circle: {
                    tooltip: {
                        start: 'Klik og træk for at slå cirkel.'
                    },
                    radius: 'Radius'
                },
                marker: {
                    tooltip: {
                        start: 'Klik på kort at sætte punkt.'
                    }
                },
                polygon: {
                    tooltip: {
                        start: 'Klik for at starte flade.',
                        cont: 'Klik for at fortsætte tegning.',
                        end: 'Klik på første punkt for at afslutte.'
                    }
                },
                polyline: {
                    error: '<strong>Fejl:</strong> fladens kanter må ikke krydse!',
                    tooltip: {
                        start: 'Klik for at starte linje.',
                        cont: 'Klik for at fortsætte tegning.',
                        end: 'Klik på sidste punkt for at afslutte.'
                    }
                },
                rectangle: {
                    tooltip: {
                        start: 'Klik og  træk for et tegne rektangel.'
                    }
                },
                simpleshape: {
                    tooltip: {
                        end: 'Slip mus for at afslutte.'
                    }
                }
            }
        },
        edit: {
            toolbar: {
                actions: {
                    save: {
                        title: 'Gem ændringer.',
                        text: 'Gem'
                    },
                    cancel: {
                        title: 'Afbryd tegning, smid alle ændringer ud.',
                        text: 'Afbryd'
                    }
                },
                buttons: {
                    edit: 'Ændre tegning.',
                    editDisabled: 'Ingen tegning at ændre.',
                    remove: 'Slet tegning.',
                    removeDisabled: 'Ingen tegning at slette.'
                }
            },
            handlers: {
                edit: {
                    tooltip: {
                        text: 'Træk håndtag, eller markør for at ændre tegning.',
                        subtext: 'Klik afbryd for at omgøre ændring.'
                    }
                },
                remove: {
                    tooltip: {
                        text: 'Klik tegning for at slette.'
                    }
                }
            }
        }
    };
    var init, switchLayer, setBaseLayer, addLegend, autocomplete, hostname, cloud, db, schema, urlVars, hash, osm, qstore = [], anchor, drawLayer, drawControl, zoomControl, metaDataKeys = [], metaDataKeysTitle = [], awesomeMarker, metaDataReady = false, settingsReady = false, makeConflict, socketId, drawnItems = new L.FeatureGroup(), infoItems = new L.FeatureGroup(), bufferItems = new L.FeatureGroup(), drawing = false;
    hostname = window.gc2Config.host;
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
        position: 'topright'
    });
    cloud.map.addControl(zoomControl);
    cloud.map.addLayer(drawnItems);
    cloud.map.addLayer(infoItems);
    cloud.map.addLayer(bufferItems);

    // Start of draw
    cloud.map.on('draw:created', function (e) {
        drawLayer = e.layer;
        drawnItems.addLayer(drawLayer);
    });
    cloud.map.on('draw:drawstart', function (e) {
        clearDrawItems();
        clearInfoItems();
        drawing = true;
    });
    cloud.map.on('draw:drawstop', function (e) {
        var geoJSON = geoJSONFromDraw();
        if (geoJSON) {
            makeConflict(geoJSON[0], geoJSON[1], false, "Fra tegning");
            drawing = false;
        }
    });
    cloud.map.on('draw:editstop', function (e) {
        var geoJSON = geoJSONFromDraw();
        if (geoJSON) {
            makeConflict(geoJSON[0], geoJSON[1], false, "Fra tegning");
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
                title: 'Søg med en flade',
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
                title: 'Søg med en cirkel',
                shapeOptions: {
                    color: '#662d91'
                }
            },
            rectangle: {
                title: 'Søg med en rektangel',
                shapeOptions: {
                    color: '#662d91'
                }
            }
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
            row;

        hitsTable.empty();
        noHitsTable.empty();
        errorTable.empty();
        clearBufferItems();
        $("#spinner span").show();
        $("#print-spinner").show();
        $('#result .btn').attr('disabled', true);
        $.ajax({
            url: "/intersection",
            data: "db=" + db + "&schema=" + schema + "&wkt=" + Terraformer.WKT.convert(geoJSON.geometry) + "&baselayer=" + baseLayer + "&buffer=" + buffer + "&socketid=" + socketId + "&text=" + encodeURIComponent(text),
            method: "POST",
            success: function (response) {
                var hitsCount = 0, noHitsCount = 0, errorCount = 0;
                $("#spinner span").hide();
                $("#result-origin").html(response.text);
                $('#main-tabs a[href="#result-content"]').tab('show');
                $('#result-content a[href="#hits-content"]').tab('show');
                $('#result .btn').attr("href", "/html?id=" + response.file);
                $.each(response.hits, function (i, v) {
                        var table = i.split(".")[1],
                            title = (typeof metaDataKeys[table].f_table_title !== "undefined" && metaDataKeys[table].f_table_title !== "" && metaDataKeys[table].f_table_title !== null) ? metaDataKeys[table].f_table_title : table;
                        if (v.error === null) {
                            row = "<tr><td>" + title + "</td><td>" + v.hits + "</td><td><input type='checkbox' data-gc2-id='" + i + "' " + ($.inArray(i, visibleLayers) > -1 ? "checked" : "") + "></td></tr>";
                            if (v.hits > 0) {
                                hitsTable.append(row);
                                hitsCount++;
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
            }
        }); // Ajax call end
    };

// Draw end
    init = function () {
        var type1, type2, gids = [], searchString,
            komKode = urlVars.komkode,
            placeStore = new geocloud.geoJsonStore({
                host: "http://eu1.mapcentia.com",
                db: "dk",
                sql: null,
                onLoad: function () {
                    //cloud.zoomToExtentOfgeoJsonStore(placeStore);
                    clearDrawItems()
                    clearInfoItems();
                    drawnItems.addLayer(placeStore.layer);
                    makeConflict({geometry: $.parseJSON(placeStore.geoJSON.features[0].properties.geojson)}, 0, true, searchString);
                }
            });
        $('#places .typeahead').typeahead({
            highlight: false
        }, {
            name: 'adresse',
            displayKey: 'value',
            templates: {
                header: '<h2 class="typeahead-heading">Adresser</h2>'
            },
            source: function (query, cb) {
                if (query.match(/\d+/g) === null && query.match(/\s+/g) === null) {
                    type1 = "vejnavn,bynavn";
                }
                if (query.match(/\d+/g) === null && query.match(/\s+/g) !== null) {
                    type1 = "vejnavn_bynavn";
                }
                if (query.match(/\d+/g) !== null) {
                    type1 = "adresse";
                }
                var names = [];

                (function ca() {
                    $.ajax({
                        url: 'http://eu1.mapcentia.com/api/v1/elasticsearch/search/dk/aws/' + type1,
                        data: '&q={"query":{"filtered":{"query":{"query_string":{"default_field":"string","query":"' + encodeURIComponent(query.toLowerCase().replace(",", "")) + '","default_operator":"AND"}},"filter":{"term":{"municipalitycode":"0' + komKode + '"}}}}}',
                        contentType: "application/json; charset=utf-8",
                        scriptCharset: "utf-8",
                        dataType: 'jsonp',
                        jsonp: 'jsonp_callback',
                        success: function (response) {
                            $.each(response.hits.hits, function (i, hit) {
                                var str = hit._source.properties.string;
                                gids[str] = hit._source.properties.gid;
                                names.push({value: str});
                            });
                            if (names.length === 1 && (type1 === "vejnavn,bynavn" || type1 === "vejnavn_bynavn")) {
                                type1 = "adresse";
                                names = [];
                                gids = [];
                                ca();
                            } else {
                                cb(names);
                            }
                        }
                    })
                })();
            }
        }, {
            name: 'matrikel',
            displayKey: 'value',
            templates: {
                header: '<h2 class="typeahead-heading">Matrikel</h2>'
            },
            source: function (query, cb) {
                var names = [];
                type2 = (query.match(/\d+/g) != null) ? "jordstykke" : "ejerlav";
                (function ca() {
                    $.ajax({
                        url: 'http://eu1.mapcentia.com/api/v1/elasticsearch/search/dk/matrikel/' + type2,
                        data: '&q={"query":{"filtered":{"query":{"query_string":{"default_field":"string","query":"' + encodeURIComponent(query.toLowerCase()) + '","default_operator":"AND"}},"filter":{"term":{"komkode":"' + komKode + '"}}}}}',
                        contentType: "application/json; charset=utf-8",
                        scriptCharset: "utf-8",
                        dataType: 'jsonp',
                        jsonp: 'jsonp_callback',
                        success: function (response) {
                            $.each(response.hits.hits, function (i, hit) {
                                var str = hit._source.properties.string;
                                gids[str] = hit._source.properties.gid;
                                names.push({value: str});
                            });
                            if (names.length === 1 && (type2 === "ejerlav")) {
                                type2 = "jordstykke";
                                names = [];
                                gids = [];
                                ca();
                            } else {
                                cb(names);
                            }
                        }
                    })
                })();
            }
        });
        $('#places .typeahead').bind('typeahead:selected', function (obj, datum, name) {
            if ((type1 === "adresse" && name === "adresse") || (type2 === "jordstykke" && name === "matrikel")) {
                placeStore.reset();

                if (name === "matrikel") {
                    placeStore.sql = "SELECT gid,the_geom,ST_asgeojson(ST_transform(the_geom,4326)) as geojson FROM matrikel.jordstykke WHERE gid=" + gids[datum.value];
                }
                if (name === "adresse") {
                    placeStore.sql = "SELECT gid,the_geom,ST_asgeojson(ST_transform(the_geom,4326)) as geojson FROM adresse.adgang WHERE gid=" + gids[datum.value];
                }
                searchString = datum.value;
                placeStore.load();
            } else {
                setTimeout(function () {
                    $(".typeahead").val(datum.value + " ").trigger("paste").trigger("input");
                }, 100)
            }
        });

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
            if (typeof data.static !== "undefined") {
                $("#print-spinner").hide();
                $('#result .btn').removeAttr("disabled");
            }
        });
        // Set the default buffer
        $("#buffer").val("10");
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
            url: hostname.replace("cdn.", "") + '/api/v1/meta/' + db + '/' + (window.gc2Options.mergeSchemata === null ? "" : window.gc2Options.mergeSchemata.join(",") + ',') + (typeof urlVars.i === "undefined" ? "" : urlVars.i.split("#")[0] + ',') + schema,
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
                        host: hostname,
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
            url: hostname.replace("cdn.", "") + '/api/v1/setting/' + db,
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
                        if (geoType !== "POLYGON" && geoType !== "MULTIPOLYGON") {
                            var res = [156543.033928, 78271.516964, 39135.758482, 19567.879241, 9783.9396205,
                                4891.96981025, 2445.98490513, 1222.99245256, 611.496226281, 305.748113141, 152.87405657,
                                76.4370282852, 38.2185141426, 19.1092570713, 9.55462853565, 4.77731426782, 2.38865713391,
                                1.19432856696, 0.597164283478, 0.298582141739, 0.149291];
                            distance = 5 * res[cloud.getZoom()];
                        }
                        qstore[index] = new geocloud.sqlStore({
                            host: hostname,
                            db: db,
                            clickable: false,
                            id: index,
                            onLoad: function () {
                                var layerObj = qstore[this.id], out = [], fieldLabel;
                                isEmpty = layerObj.isEmpty();
                                if (!isEmpty && !not_querable) {
                                    $('#modal-info-body').show();
                                    var fieldConf = $.parseJSON(metaDataKeys[value.split(".")[1]].fieldconf);
                                    $("#info-tab").append('<li><a data-toggle="tab" href="#_' + index + '">' + layerTitel + '</a></li>');
                                    $("#info-pane").append('<div class="tab-pane" id="_' + index + '"><button type="button" class="btn btn-primary btn-xs" data-gc2-title="' + layerTitel + '" data-gc2-store="' + index + '">Søg med dette objekt</button><table class="table table-condensed"><thead><tr><th>' + __("Property") + '</th><th>' + __("Value") + '</th></tr></thead></table></div>');

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
                                        makeConflict(qstore[$(this).data('gc2-store')].geoJSON.features [0], 0, false, "Fra objekt i laget: " + $(this).data('gc2-title'));
                                    });
                                    $('#main-tabs a[href="#info-content"]').tab('show');
                                    clearDrawItems();
                                }
                            }
                        });
                        //cloud.addGeoJsonStore(qstore[index]);
                        infoItems.addLayer(qstore[index].layer);
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