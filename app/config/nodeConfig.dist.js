// gc2 and geoserver is aliases of the linked Docker containers
nodeConfig = {
    host: "gc2", // Don't write protocol
    utmZone: "32", // For projection of buffering
    print: {
        host: "geoserver", // Don't write protocol
        port: "8080"
    },
    pg: {
        host: "gc2",
        user: "postgres",
        pw: "1234"
    },
    geomatic: {
        user: "x",
        pw: "x"
    }
};
module.exports = nodeConfig;