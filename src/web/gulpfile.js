'use strict';
const bower = require('gulp-bower');
const sass = require('gulp-sass');
const gulp = require('gulp');
const del = require('del');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const htmlreplace = require('gulp-html-replace');
const typescript = require('gulp-typescript');
const tscConfig = require('./tsconfig.json');
const sourcemaps = require('gulp-sourcemaps');
const tslint = require('gulp-tslint');
const browserSync = require('browser-sync');
const reload = browserSync.reload;
const tsconfig = require('tsconfig-glob');
const addsrc = require('gulp-add-src');
const Builder = require('systemjs-builder');

var tsProject = typescript.createProject('tsconfig.json', {
  typescript: require('typescript'),
  outFile: 'app.js'
});

// clean the contents of the distribution directory
gulp.task('clean', function () {
  return del('dist/**/*');
});

gulp.task('sass', function () {
  gulp.src('./sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('css'));
});

gulp.task('sass:watch', function () {
  gulp.watch('./sass/**/*.scss', ['sass']);
});

gulp.task('bower', function() {
  return bower()
    .pipe(gulp.dest('lib/'));
});

// copy static assets - i.e. non TypeScript compiled source
gulp.task('copy:assets', ['clean', 'sass'], function() {
  return gulp.src(['templates/**/*', 'images/**/*',
        'css/**/*'], { base : './' })
    .pipe(gulp.dest('dist'))
});

// copy dependencies
gulp.task('bundle:vendor', ['clean'], function() {
  return gulp.src([
      'js/jquery.js',
      'js/foundation.js',
      'js/what-input.js',
      'node_modules/core-js/client/shim.min.js',
      'node_modules/zone.js/dist/zone.js',
      'node_modules/rxjs/bundles/Rx.js',
      'node_modules/reflect-metadata/Reflect.js',
      'node_modules/systemjs/dist/system.src.js',
    ])
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(concat('vendors.min.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'))
});

// linting
gulp.task('tslint', function() {
  return gulp.src('app/**/*.ts')
    .pipe(tslint())
    .pipe(tslint.report('verbose'));
});

gulp.task('html', ['bundle:app', 'bundle:vendor'], function() {
  gulp.src('index.html')
    .pipe(htmlreplace({
      'vendor': 'vendors.min.js',
      'app': 'bundle.min.js',
    }))
    .pipe(gulp.dest('dist'));
});

// TypeScript compile
gulp.task('compile', ['clean'], function () {
  return gulp
    .src(tscConfig.files)
    .pipe(addsrc.append('config.prod.js'))
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(typescript(tscConfig.compilerOptions))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});

gulp.task('bundle:app', ['compile'], function() {
  var builder = new Builder('', 'systemjs.config.js');
  return builder
      .buildStatic('dist/app/main.js', 'dist/bundle.min.js', { minify: true, sourceMaps: true})
      .catch(function(err) {
          console.log('Build error');
          console.log(err);
      });
});

gulp.task('build:watch', ['sass', 'build'], function () {
  gulp.watch(['app/**/*', 'sass/**/*.scss', 'index.html', 'templates/**/*'], ['build']);
});

// update the tsconfig files based on the glob pattern
gulp.task('tsconfig-glob', function () {
  return tsconfig({
    configPath: '.',
    indent: 2
  });
});

// Run browsersync for development
gulp.task('serve', ['build'], function() {
  browserSync({
    server: {
      baseDir: 'dist',
    },
    logLevel: "silent",
    logConnections: false,
    browser: "google chrome",
    notify: false,
    injectChanges: true,
    // browser: ["google chrome", "firefox"]
  });

  gulp.watch(['app/**/*','sass/**/*.scss', 'index.html', 'templates/**/*'], ['buildAndReload']);
});

gulp.task('build', ['compile', 'copy:assets', 'bundle:vendor','bundle:app', 'html']);
gulp.task('buildAndReload', ['build'], reload);
gulp.task('default', ['build']);