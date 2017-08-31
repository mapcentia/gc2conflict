createSearch = function (me) {
    var type1, type2, type3, gids = [], source = [], searchString, dslA, dslM, shouldA = [], shouldM = [], dsl1, dsl2,
        komKode = me.urlVars.komkode || conflictConfig.komKode;
    var placeStore = new geocloud.geoJsonStore({
        host: "http://eu1.mapcentia.com",
        db: "dk",
        sql: null,
        pointToLayer: null,
        onLoad: function () {
            //cloud.zoomToExtentOfgeoJsonStore(placeStore);
            me.clearDrawItems();
            me.clearInfoItems();
            me.drawnItems.addLayer(placeStore.layer);
            me.makeConflict({geometry: $.parseJSON(placeStore.geoJSON.features[0].properties.geojson)}, 0, true, searchString);
            if (placeStore.geoJSON.features[0].properties.esr_ejendomsnummer !== undefined) {
                $("#ejdnr").html(" (Samlet ejendom nr.: " + placeStore.geoJSON.features[0].properties.esr_ejendomsnummer + ")");
            } else {
                $("#ejdnr").empty();
            }
        }
    });

    if (typeof komKode === "string") {
        komKode = [komKode];
    }
    $.each(komKode, function (i, v) {
        shouldA.push({
            "term": {
                "properties.kommunekode": "0" + v
            }
        });
        shouldM.push({
            "term": {
                "properties.kommunekode": "" + v
            }
        });
    });

    plugs = [{
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

                switch (type1) {
                    case "vejnavn,bynavn":
                        dsl1 = {
                            "from": 0,
                            "size": 20,
                            "query": {
                                "bool": {
                                    "must": {
                                        "query_string": {
                                            "default_field": "properties.string2",
                                            "query": encodeURIComponent(query.toLowerCase().replace(",", "")),
                                            "default_operator": "AND"
                                        }
                                    },
                                    "filter": {
                                        "bool": {
                                            "should": shouldA
                                        }
                                    }
                                }
                            },
                            "aggregations": {
                                "properties.postnrnavn": {
                                    "terms": {
                                        "field": "properties.postnrnavn",
                                        "size": 20,
                                        "order": {
                                            "_term": "asc"
                                        }
                                    },
                                    "aggregations": {
                                        "properties.postnr": {
                                            "terms": {
                                                "field": "properties.postnr",
                                                "size": 20
                                            },
                                            "aggregations": {
                                                "properties.kommunekode": {
                                                    "terms": {
                                                        "field": "properties.kommunekode",
                                                        "size": 20
                                                    },
                                                    "aggregations": {
                                                        "properties.regionskode": {
                                                            "terms": {
                                                                "field": "properties.regionskode",
                                                                "size": 20
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        };
                        dsl2 = {
                            "from": 0,
                            "size": 20,
                            "query": {
                                "bool": {
                                    "must": {
                                        "query_string": {
                                            "default_field": "properties.string3",
                                            "query": encodeURIComponent(query.toLowerCase().replace(",", "")),
                                            "default_operator": "AND"
                                        }
                                    },
                                    "filter": {
                                        "bool": {
                                            "should": shouldA
                                        }
                                    }
                                }
                            },
                            "aggregations": {
                                "properties.vejnavn": {
                                    "terms": {
                                        "field": "properties.vejnavn",
                                        "size": 20,
                                        "order": {
                                            "_term": "asc"
                                        }
                                    },
                                    "aggregations": {
                                        "properties.kommunekode": {
                                            "terms": {
                                                "field": "properties.kommunekode",
                                                "size": 20
                                            },
                                            "aggregations": {
                                                "properties.regionskode": {
                                                    "terms": {
                                                        "field": "properties.regionskode",
                                                        "size": 20
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        };
                        break;
                    case "vejnavn_bynavn":
                        dsl1 = {
                            "from": 0,
                            "size": 20,
                            "query": {
                                "bool": {
                                    "must": {
                                        "query_string": {
                                            "default_field": "properties.string1",
                                            "query": encodeURIComponent(query.toLowerCase().replace(",", "")),
                                            "default_operator": "AND"
                                        }
                                    },
                                    "filter": {
                                        "bool": {
                                            "should": shouldA
                                        }
                                    }
                                }
                            },
                            "aggregations": {
                                "properties.vejnavn": {
                                    "terms": {
                                        "field": "properties.vejnavn",
                                        "size": 20,
                                        "order": {
                                            "_term": "asc"
                                        }
                                    },
                                    "aggregations": {
                                        "properties.postnrnavn": {
                                            "terms": {
                                                "field": "properties.postnrnavn",
                                                "size": 20
                                            },
                                            "aggregations": {
                                                "properties.kommunekode": {
                                                    "terms": {
                                                        "field": "properties.kommunekode",
                                                        "size": 20
                                                    },
                                                    "aggregations": {
                                                        "properties.regionskode": {
                                                            "terms": {
                                                                "field": "properties.regionskode",
                                                                "size": 10
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        };
                        break;
                    case "adresse":
                        dsl1 = {
                            "from": 0,
                            "size": 20,
                            "query": {
                                "bool": {
                                    "must": {
                                        "query_string": {
                                            "default_field": "properties.string4",
                                            "query": encodeURIComponent(query.toLowerCase().replace(",", "")),
                                            "default_operator": "AND"
                                        }
                                    },
                                    "filter": {
                                        "bool": {
                                            "should": shouldA
                                        }
                                    }
                                }
                            },

                            "sort": [
                                {
                                    "properties.vejnavn": {
                                        "order": "asc"
                                    }
                                },
                                {
                                    "properties.husnr": {
                                        "order": "asc"
                                    }
                                }
                            ]
                        };
                        break;
                }

                $.ajax({
                    url: '//gc2.io/api/v1/elasticsearch/search/dk/dar/adgangsadresser_view',
                    data: '&q=' + JSON.stringify(dsl1),
                    contentType: "application/json; charset=utf-8",
                    scriptCharset: "utf-8",
                    dataType: 'jsonp',
                    jsonp: 'jsonp_callback',
                    success: function (response) {
                        if (type1 === "vejnavn,bynavn") {
                            $.each(response.aggregations["properties.postnrnavn"].buckets, function (i, hit) {
                                var str = hit.key;
                                names.push({value: str});
                            });
                            $.ajax({
                                url: '//gc2.io/api/v1/elasticsearch/search/dk/dar/adgangsadresser_view',
                                data: '&q=' + JSON.stringify(dsl2),
                                contentType: "application/json; charset=utf-8",
                                scriptCharset: "utf-8",
                                dataType: 'jsonp',
                                jsonp: 'jsonp_callback',
                                success: function (response) {
                                    if (type1 === "vejnavn,bynavn") {
                                        $.each(response.aggregations["properties.vejnavn"].buckets, function (i, hit) {
                                            var str = hit.key;
                                            names.push({value: str});
                                        });
                                    }
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
                        } else if (type1 === "vejnavn_bynavn") {
                            $.each(response.aggregations["properties.vejnavn"].buckets, function (i, hit) {
                                var str = hit.key;
                                $.each(hit["properties.postnrnavn"].buckets, function (m, n) {
                                    var tmp = str;
                                    tmp = tmp + ", " + n.key;
                                    names.push({value: tmp});
                                });

                            });
                            if (names.length === 1 && (type1 === "vejnavn,bynavn" || type1 === "vejnavn_bynavn")) {
                                type1 = "adresse";
                                names = [];
                                gids = [];
                                ca();
                            } else {
                                cb(names);
                            }

                        } else if (type1 === "adresse") {
                            $.each(response.hits.hits, function (i, hit) {
                                var str = hit._source.properties.string4;
                                gids[str] = hit._source.properties.gid;
                                source[str] = hit._source;
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
                    switch (type2) {
                        case "jordstykke":
                            dslM = {
                                "from": 0,
                                "size": 20,
                                "query": {
                                    "bool": {
                                        "must": {
                                            "query_string": {
                                                "default_field": "properties.string1",
                                                "query": encodeURIComponent(query.toLowerCase()),
                                                "default_operator": "AND"
                                            }
                                        },
                                        "filter": {
                                            "bool": {
                                                "should": shouldM
                                            }
                                        }
                                    }
                                }
                            };
                            break;
                        case "ejerlav":
                            dslM = {
                                "from": 0,
                                "size": 20,
                                "query": {
                                    "bool": {
                                        "must": {
                                            "query_string": {
                                                "default_field": "properties.string1",
                                                "query": encodeURIComponent(query.toLowerCase()),
                                                "default_operator": "AND"
                                            }
                                        },
                                        "filter": {
                                            "bool": {
                                                "should": shouldM
                                            }
                                        }
                                    }
                                },
                                "aggregations": {
                                    "properties.ejerlavsnavn": {
                                        "terms": {
                                            "field": "properties.ejerlavsnavn",
                                            "order": {
                                                "_term": "asc"
                                            },
                                            "size": 20
                                        },
                                        "aggregations": {
                                            "properties.kommunekode": {
                                                "terms": {
                                                    "field": "properties.kommunekode",
                                                    "size": 20
                                                }
                                            }
                                        }
                                    }
                                }
                            };
                            break;
                    }

                    $.ajax({
                        url: '//gc2.io/api/v1/elasticsearch/search/dk/matrikel',
                        data: '&q=' + JSON.stringify(dslM),
                        contentType: "application/json; charset=utf-8",
                        scriptCharset: "utf-8",
                        dataType: 'jsonp',
                        jsonp: 'jsonp_callback',
                        success: function (response) {
                            if (type2 === "ejerlav") {
                                $.each(response.aggregations["properties.ejerlavsnavn"].buckets, function (i, hit) {
                                    var str = hit.key;
                                    names.push({value: str});
                                });
                            } else {
                                $.each(response.hits.hits, function (i, hit) {
                                    var str = hit._source.properties.string1;
                                    gids[str] = hit._source.properties.gid;
                                    names.push({value: str});
                                });
                            }
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
    }];

    if (conflictConfig.db === "esbjerg") {
        plugs.push({
            name: 'kpplandk2',
            displayKey: 'value',
            templates: {
                header: '<h2 class="typeahead-heading">Rammer</h2>'
            },
            source: function (query, cb) {
                var names = [];
                type3 = "kpplandk2";
                (function ca() {
                    $.ajax({
                        url: 'http://cowi.mapcentia.com/api/v1/elasticsearch/search/esbjerg/kommuneplan18/kpplandk2_view',
                        data: '&q={"query":{"query_string":{"default_field":"properties.enrid","query":"' + encodeURIComponent(query.toLowerCase()) + '"}}}',
                        dataType: 'jsonp',
                        contentType: "application/json; charset=utf-8",
                        scriptCharset: "utf-8",
                        jsonp: 'jsonp_callback',
                        success: function (response) {
                            $.each(response.hits.hits, function (i, hit) {
                                var str = hit._source.properties.enrid;
                                gids[str] = hit._source.properties.enrid;
                                names.push({value: str});
                            });
                            cb(names);
                        }
                    });
                })();
            }
        })
    }

    $('#custom-search').typeahead({
        highlight: false
    }, plugs);
    $('#custom-search').bind('typeahead:selected', function (obj, datum, name) {
        if ((type1 === "adresse" && name === "adresse") || (type2 === "jordstykke" && name === "matrikel") || (type3 === "kpplandk2" && name === "kpplandk2")) {
            placeStore.reset();

            if (name === "matrikel") {
                placeStore.host = "//gc2.io";
                placeStore.db = "dk";
                placeStore.sql = "SELECT esr_ejendomsnummer,ST_Multi(ST_Union(the_geom)),ST_asgeojson(ST_transform(ST_Multi(ST_Union(the_geom)),4326)) as geojson FROM matrikel.jordstykke WHERE esr_ejendomsnummer = (SELECT esr_ejendomsnummer FROM matrikel.jordstykke WHERE gid=" + gids[datum.value] + ") group by esr_ejendomsnummer";
            }
            if (name === "adresse") {
                placeStore.host = "//gc2.io";
                placeStore.db = "dk";
                placeStore.sql = "SELECT esr_ejendomsnummer,ST_Multi(ST_Union(the_geom)),ST_asgeojson(ST_transform(ST_Multi(ST_Union(the_geom)),4326)) as geojson FROM matrikel.jordstykke WHERE esr_ejendomsnummer = (SELECT esr_ejendomsnummer FROM matrikel.jordstykke WHERE (the_geom && (SELECT ST_transform(the_geom, 25832) FROM dar.adgangsadresser WHERE id='" + gids[datum.value] + "')) AND ST_Intersects(the_geom, (SELECT ST_transform(the_geom, 25832) FROM dar.adgangsadresser WHERE id='" + gids[datum.value] + "'))) group by esr_ejendomsnummer";
            }
            if (name === "kpplandk2") {
                placeStore.host = "http://cowi.mapcentia.com";
                placeStore.db = "esbjerg";
                placeStore.sql = "SELECT gid,the_geom,ST_asgeojson(ST_transform(the_geom,4326)) as geojson FROM kommuneplan18.kpplandk2_view WHERE enrid='" + gids[datum.value] + "'";
            }
            searchString = datum.value;
            placeStore.load();
        } else {
            setTimeout(function () {
                $(".typeahead").val(datum.value + " ").trigger("paste").trigger("input");
            }, 100)
        }
    });
};
module.exports = createSearch;