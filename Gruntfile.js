module.exports = function (grunt) {
    "use strict";
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                funcscope: true,
                shadow: true,
                evil: true,
                validthis: true,
                asi: true,
                newcap: false,
                notypeof: false,
                eqeqeq: false,
                loopfunc: true,
                es3: true,
                devel: false,
                eqnull: true
            },
            all: ['public/js/*.js']
        },
        hogan: {
            publish: {
                options: {
                    defaultName: function (filename) {
                        return filename.split('/').pop();
                    }
                },
                files: {
                    "app/public/js/templates.js": ["app/public/templates/body.tmpl", "app/public/templates/embed.tmpl", "app/public/templates/embed_min.tmpl"]
                }
            }
        },
        browserify: {
            publish: {
                files: {
                    'app/public/js/bundle.js': ['app/config/browserify.js']
                }
            }
        },
        gitpull: {
            production: {
                options: {}
            }
        },
        gitreset: {
            production: {
                options: {
                    mode: 'hard'
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-templates-hogan');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-git');

    grunt.registerTask('default', ['hogan', 'browserify']);
    grunt.registerTask('production', ['gitreset', 'gitpull', 'hogan', 'browserify']);
};




