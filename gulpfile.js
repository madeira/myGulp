"use strict";

var gulp            = require("gulp");
var sass            = require("gulp-sass");
var path            = require("path");
var postcss         = require("gulp-postcss");
var notify          = require("gulp-notify");
var autoprefixer    = require("autoprefixer-core");
var browserSync     = require("browser-sync").create();
var minifyCss       = require("gulp-minify-css");
var imagemin        = require("gulp-imagemin");
var pngquant        = require("imagemin-pngquant");
var clean           = require("gulp-clean");
var styleguide      = require("sc5-styleguide");
var runSequence     = require('gulp-run-sequence');
var include         = require("gulp-include");

var root    = path.resolve(__dirname); 
var src     = path.resolve(root);
var dest    = path.resolve(root, "static");
var doc     = path.resolve(root, "sass-doc");

var proxyAddress = "localhost:8000";
var handleErrors = function() {
    var args = Array.prototype.slice.call(arguments);

    notify.onError({
        title: "Compile Error",
        message: "<%= error.message %>"
    }).apply(this, args);

    this.emit("end");
};

var config = {}

config.styles = {
    src: path.join(src, "static", "**", "*.{scss,sass}"),
    img_src: path.join(src, "**", "frontend", "**", "img", "**", "*.*"),
    watch: path.join(src, "**", "frontend", "**", "*.{scss,sass}"),
    dest: path.join(dest, "css"),
    img_dest: path.join(dest, "img"),
    img_move: path.join(dest, "img", "**", "*.*"),
    doc_src: path.join(doc),
    doc_scss: path.join(doc, "**", "*.scss"),
    doc_img: path.join(doc, "static"),
}

gulp.task("default", function() {
  // place code for your default task here
});

// browser sync

gulp.task("serve", function() {
    browserSync.init({
        proxy: proxyAddress
    });

    gulp.watch(config.styles.watch, ["sass"])
        .on("change", browserSync.reload);

});

// sass compile and minification

gulp.task("sass", function () {
    var processors = [
        autoprefixer({browsers: ["last 3 version", "IE 8"]}),
    ];

    return gulp.src(config.styles.watch)
        .pipe(sass())
        .on("error", handleErrors)
        .pipe(postcss(processors))
        .on("error", handleErrors)
        .pipe(minifyCss())
        .on("error", handleErrors)
        .pipe(gulp.dest(config.styles.dest));
});

gulp.task("clean-img", function () {
    return gulp
        .src(config.styles.img_dest)
        .pipe(clean({read: false}))
});

// img minification 

gulp.task("imgmin", ["clean-img"], function () {
    return gulp
        .src(config.styles.img_src)
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest(config.styles.img_dest));
});

// front doc tasks

gulp.task("clean-doc", function () {
    return gulp
        .src(config.styles.doc_src)
        .pipe(clean({read: false}))
});

gulp.task("remove-doc-scss", function () {
    return gulp
        .src(config.styles.doc_scss)
        .pipe(clean({force: true}))
});

gulp.task("img-to-doc", function() {
   return gulp
       .src(config.styles.img_move)
       .pipe(gulp.dest(config.styles.doc_img));
});

gulp.task("styleguide:generate", function() {
  return gulp
    .src(config.styles.watch)
    .pipe(include())
    .pipe(styleguide.generate({
        title: "My Styleguide",
        server: true,
        port: 3100,
        rootPath: config.styles.doc_src,
        overviewPath: "README.md"
      }))
    .pipe(gulp.dest(config.styles.doc_src));
});

gulp.task("styleguide:applystyles", function() {
  return gulp.src(config.styles.src)
    .pipe(sass({
      errLogToConsole: true
    }))
    .pipe(styleguide.applyStyles())
    .pipe(gulp.dest(config.styles.doc_src));
});

gulp.task('build-doc', function(callback) {
  runSequence("clean-doc",
              ["styleguide:generate", "styleguide:applystyles", "img-to-doc"],
              "remove-doc-scss",
              callback);
});