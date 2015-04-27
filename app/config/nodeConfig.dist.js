// gc2 and geoserver is alias of the linked Docker containers
nodeConfig = {
    host: "gc2", // Don't write protocol
    print:{
        host: "geoserver", // Don't write protocol
        port: "8080"
    },
    pg: {
        host: "gc2",
        user: "postgres",
        pw: "1234"
    }
};
module.exports = nodeConfig;