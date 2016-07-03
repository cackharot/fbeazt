'use strict';
const bower = require('gulp-bower');
const sass = require('gulp-sass');
const gulp = require('gulp');
const del = require('del');
const typescript = require('gulp-typescript');
const tscConfig = require('./tsconfig.json');
const sourcemaps = require('gulp-sourcemaps');
const tslint = require('gulp-tslint');
const browserSync = require('browser-sync');
const reload = browserSync.reload;
const tsconfig = require('tsconfig-glob');

// clean the contents of the distribution directory
gulp.task('clean', function () {
  return del('dist/**/*');
});

gulp.task('sass', function () {
  gulp.src('./sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./dist/css'));
});

gulp.task('sass:watch', function () {
  gulp.watch('./sass/**/*.scss', ['sass']);
});

gulp.task('bower', function() {
  return bower()
    .pipe(gulp.dest('lib/'));
});

// copy static assets - i.e. non TypeScript compiled source
gulp.task('copy:assets', ['clean'], function() {
  return gulp.src(['app/**/*', 'index.html',
        'templates/**/*', 'images/**/*', 'js/**/*',
        'css/**/*', '!app/**/*.ts'], { base : './' })
    .pipe(gulp.dest('dist'))
});

// copy dependencies
gulp.task('copy:libs', ['clean'], function() {
  return gulp.src([
      'node_modules/core-js/client/shim.min.js',
      'node_modules/zone.js/dist/zone.js',
      'node_modules/reflect-metadata/Reflect.js',
      'node_modules/systemjs/dist/system.src.js',
      'systemjs.config.js',
    ])
    .pipe(gulp.dest('dist/lib'))
});

gulp.task('copy:node_modules', ['clean'], function() {
  return gulp.src([
      'node_modules/@angular/**/*',
      'node_modules/angular2-in-memory-web-api/**/*',
      'node_modules/angular2-localstorage/**/*',
      'node_modules/rxjs/**/*',
      'node_modules/lodash/lodash.js',
      'node_modules/moment/moment.js',
      'node_modules/ng2-popover/**/*',
    ],{ "base" : "." })
    .pipe(gulp.dest('dist'))
});

// linting
gulp.task('tslint', function() {
  return gulp.src('app/**/*.ts')
    .pipe(tslint())
    .pipe(tslint.report('verbose'));
});


// TypeScript compile
gulp.task('compile', ['clean'], function () {
  return gulp
    .src(tscConfig.files)
    .pipe(sourcemaps.init())
    .pipe(typescript(tscConfig.compilerOptions))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
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

  gulp.watch(['app/**/*', 'index.html', 'templates/**/*', 'css/**/*'], ['buildAndReload']);
});

// gulp.task('build', ['tslint', 'compile', 'copy:libs', 'copy:assets']);
gulp.task('build', ['compile', 'copy:libs', 'copy:node_modules', 'copy:assets']);
gulp.task('buildAndReload', ['build'], reload);
gulp.task('default', ['build']);