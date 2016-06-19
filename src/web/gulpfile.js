'use strict';
var gulp = require('gulp');
var bower = require('gulp-bower');
var sass = require('gulp-sass');

gulp.task('sass', function () {
  gulp.src('./sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./css'));
});

gulp.task('sass:watch', function () {
  gulp.watch('./sass/**/*.scss', ['sass']);
});

gulp.task('bower', function() {
  return bower()
    .pipe(gulp.dest('lib/'));
});
