nodeConfig = {
    host: "gc2", // Without protocol
    print:{
        host: "geoserver", // Without protocol
        port: "8080"
    },
    pg: {
        host: "gc2",
        user: "postgres",
        pw: "1234"
    }
};
module.exports = nodeConfig;