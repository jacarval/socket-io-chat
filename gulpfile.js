var gulp = require('gulp');
var react = require('gulp-react');
 
gulp.task('default', function () {
    return gulp.src('public/jsx/main.jsx')
        .pipe(react())
        .pipe(gulp.dest('public/js'));
});

gulp.task('watch', ['default'], function() {
    var watchFiles = [
        'public/jsx/main.jsx'
    ];

    gulp.watch(watchFiles, ['default']);
});