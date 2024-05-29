module.exports = function(grunt) {
  const Diff = require('diff');
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    cssmin: {
      options: {
        mergeIntoShorthands: false,
        roundingPrecision: -1
      },
      combine: {
        files: {
        'dist/mapml.css': ['node_modules/leaflet/dist/leaflet.css', 'node_modules/leaflet.locatecontrol/dist/L.Control.Locate.css', 'src/mapml.css']
        }
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',
        sourceMap: {
          includeSources: true
        }
      },
      dist: {
        files: {
          'dist/mapml.js':        ['<%= rollup.main.dest %>'],
          'dist/web-map.js':      ['src/web-map.js'],
          'dist/mapml-viewer.js': ['src/mapml-viewer.js'],
          'dist/map-feature-table.js': ['src/map-feature-table.js'],
          'dist/map-caption.js':  ['src/map-caption.js'],
          'dist/map-feature.js':  ['src/map-feature.js'],
          'dist/map-extent.js':   ['src/map-extent.js'],
          'dist/map-input.js':    ['src/map-input.js'],
          'dist/map-select.js':    ['src/map-select.js'],
          'dist/map-link.js':    ['src/map-link.js'],
          'dist/map-style.js':    ['src/map-style.js'],
          'dist/map-area.js':     ['src/map-area.js'],
          'dist/layer.js':        ['src/layer.js'],
          'dist/leaflet.js':      ['dist/leaflet-src.js',
                                   'dist/proj4-src.js',
                                   'dist/proj4leaflet.js',
                                   'dist/L.Control.Locate.js']
        } 
      }
    },
    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js','test/**/*.spec.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          console: true,
          module: true,
          document: true
        },
        // ensure that jshint keeps processing after an error
        force: true,
        esversion: 11,
        laxbreak: true // used to fix differences with prettier 
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    },
    copy : {
    	 main : {
        files: [
          {
            expand: true,
            cwd: 'node_modules/leaflet/dist/',
            flatten: true,
            filter: 'isFile',
            src: ['leaflet-src.js'],
            dest: 'dist/'
          },
          {
            expand: true,
            cwd: 'node_modules/proj4/dist/',
            flatten: true,
            filter: 'isFile',
            src: ['proj4-src.js'],
            dest: 'dist/'
          },
          {
            expand: true,
            cwd: 'node_modules/proj4leaflet/src/',
            flatten: true,
            filter: 'isFile',
            src: ['proj4leaflet.js'],
            dest: 'dist/'
          },
          {
            expand: true,
            flatten: true,
            filter: 'isFile',
            src: ['index.html'],
            dest: 'dist/'
          },
          {
            expand: true,
            cwd: 'node_modules/leaflet.locatecontrol/src/',
            flatten: true,
            filter: 'isFile',
            src: ['L.Control.Locate.js'],
            dest: 'dist/'
          }
        ],
        options: {
          process: function (content, srcpath) {
            // see patch.diff file for comments on why patching is necessary
            if (srcpath.includes('proj4leaflet.js')) {
              console.log('PATCHING: ', srcpath);
              const patch = grunt.file.read('src/proj4leaflet/patch.diff');
              return Diff.applyPatch(content, patch);
            } else if (srcpath.includes('proj4-src.js')) {
              console.log('PATCHING: ', srcpath);
              const patch = grunt.file.read('src/proj4/patch.diff');
              return Diff.applyPatch(content, patch);
            } else if (srcpath.includes('index.html')) {
              console.log('MODIFYING: ', srcpath);
              var pathToModuleRE =  /dist\/mapml-viewer\.js/gi;
              return content.replace(pathToModuleRE,"./mapml-viewer.js");
            } else {
              return content;
            }
          }
        }
      },
      images: {
        // if you pass images through the process function, it corrupts them,
        // so you have to do this in a separate grunt 'target' ('main' being the
        // default one, I believe).
        files: [
          {
            expand: true,
            cwd: 'node_modules/leaflet/dist/images/',
            flatten: true,
            filter: 'isFile',
            src: ['*.png'],
            dest: 'dist/images/'
          }
        ]
      },
      experiments: {
        files: [
          {
            expand: true,
            src: ['dist/*'],
            dest: '../experiments'
      }
        ]
      },
      extension: {
        files: [
          {
            expand: true,
            src: ['dist/*'],
            dest: '../mapml-extension/src'
          }
        ]
      },
      geoserver: {
        files: [
          {
            expand: true,
            cwd: 'dist',
            src: ['*.js','*.map','*.css'],
            dest: '../geoserver/src/extension/mapml/src/main/resources/viewer/widget'
          }
        ]
      },
      docs: {
        files: [
          {
            expand: true,
            src: ['dist/*'],
            dest: '../web-map-doc/static'
          }
        ]
      }
    },
    clean: {
      dist: ['dist'],
      tidyup: ['dist/leaflet-src.js','dist/proj4-src.js','dist/proj4leaflet.js','dist/L.Control.Locate.js'],
      experiments: {
        options: {force: true},
        src: ['../experiments/dist']
      },
      extension: {
        options: {force: true},
        src: ['../mapml-extension/src/dist']
      },
      geoserver: {
        options: {force: true},
        src: ['../geoserver/src/extension/mapml/src/main/resources/viewer/widget/*.js','../geoserver/src/extension/mapml/src/main/resources/viewer/widget/*.map','../geoserver/src/extension/mapml/src/main/resources/viewer/widget/*.css']
      },
      docs: {
        options: {force: true},
        src: ['../web-map-doc/dist']
      }
    },
    rollup: {
      options: {
        format: 'iife'
      },
      main: {
        dest: 'dist/mapml.js',
        src: 'src/mapml/index.js' // Only one source file is permitted
      }
    },
    prettier: {
      options: {
        // https://prettier.io/docs/en/options.html
        progress: true
      },
      files: {
        src: [
          "src/**/*.js",
          "test/**/*.js"
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-rollup');
  grunt.loadNpmTasks('grunt-prettier');

  grunt.registerTask('format', ['prettier', 'jshint']);
  grunt.registerTask('default', ['clean:dist', 'copy:main', 'copy:images', 'format', 'rollup', 
                                 'uglify', 'cssmin','clean:tidyup']);
  grunt.registerTask('experiments',['clean:experiments','default','copy:experiments']);
  grunt.registerTask('extension',['clean:extension','default','copy:extension']);
  grunt.registerTask('geoserver',['clean:geoserver','default','copy:geoserver']);
  grunt.registerTask('docs', ['clean:docs','default','copy:docs']);
  grunt.registerTask('sync', ['default','experiments','extension','docs']);

};
