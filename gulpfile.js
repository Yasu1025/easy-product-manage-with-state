'use strict';

const gulp = require('gulp');
const bs = require('browser-sync');
const minimist = require('minimist');
const del = require('del');
const rs = require('run-sequence');

// Gulpの状態管理
const gChanged = require('gulp-changed');           // 変更を監視・変更があった場合のみ処理を実行
const gIf = require('gulp-if');                     // gulpのタスク内でif文を実行
const gPlumber = require('gulp-plumber');           // エラー発生によるタスク終了を回避
const gNotify = require('gulp-notify');             // デスクトップ上に状態を通知

// Sass関連
const gSass = require('gulp-sass');  　　　　　　　　　// Sassのコンパイルを実行
const gSourcemaps = require('gulp-sourcemaps');　　　// Sassのソースマップを出力
const gCsscomb = require('gulp-csscomb');           // CSSのプロパティの並びを補正
const gAutoprefixer = require('gulp-autoprefixer'); // 自動で接頭辞を補完

// 圧縮関連
const gCleanCSS = require('gulp-clean-css');        // CSSの圧縮
const gUglify = require('gulp-uglify');             // JavaScriptの圧縮

// ejs
const gEjs = require('gulp-ejs');
const rename = require('gulp-rename');

// js
const babel = require('gulp-babel');

const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');

// 引数を取得 （通常：dev か 納品：release を判定）
const envOptions = {
  string: 'env',
  default: {
    env: process.env.NODE_ENV || 'dev'
  }
};
const options = minimist(process.argv.slice(2), envOptions);

// 各種設定を定義
const config = {
  dir: {
    src: 'src',
    dest: 'dest',
    release: 'release'
  },
  dev: {
    browsers: {
      iOS : '10.1',
      Android: '4.4'
    }
  },
  isRelease: (options.env === 'release') ? true : false
};

/*
 * タスク
 * Sassのコンパイルとコピー
 */
gulp.task('sass', function() {
  return gulp.src([config.dir.src + '/scss/**/*.scss'])
      .pipe(gPlumber({ errorHandler: gNotify.onError('<%= error.message %>') }))
      .pipe(gIf(!config.isRelease, gSourcemaps.init()))
      .pipe(gSass({ outputStyle: 'expanded' }))
      .pipe(gIf(!config.isRelease, gSourcemaps.write({ includeContent: false })))
      .pipe(gIf(!config.isRelease, gSourcemaps.init({ loadMaps: true })))
      .pipe(gCsscomb())
      .pipe(gAutoprefixer({
        browsers: [
          'last 2 version',
          'iOS >= ' + config.dev.browsers.iOS,
          'Android >=  ' + config.dev.browsers.Android
        ],
        cascade: false
      }))
      .pipe(gIf(!config.isRelease, gSourcemaps.write('./')))
      // .pipe(gIf(config.isRelease, gCleanCSS()))
      .pipe(gIf(!config.isRelease, gulp.dest(config.dir.dest + '/assets/css')))
      .pipe(gIf(config.isRelease, gulp.dest(config.dir.release + '/assets/css')))
      .pipe(gIf(!config.isRelease, bs.stream()));
});

/*
 * タスク
 * JavaScriptの圧縮とコピー
 */
gulp.task('minify-js', function() {
  return gulp.src([config.dir.src + '/templates/assets/js/**/*.js'])
    // .pipe(gUglify())
    .pipe(gulp.dest(config.dir.release + '/assets/js'));
});

/*
 * タスク
 * CSSの圧縮とコピー
 */
gulp.task('minify-css', function() {
  return gulp.src([config.dir.src + '/templates/assets/css/**/*.css'])
    // .pipe(gCleanCSS())
    .pipe(gulp.dest(config.dir.release + '/assets/css'));
});


/*
 * タスク
 * ejs
 */
gulp.task('ejs', function() {
  return gulp.src([config.dir.src + '/templates/**/*.ejs', '!' + config.dir.src + '/templates/**/_*.ejs'])
    .pipe(gEjs())
    .pipe(rename({extname: '.html'}))
    .pipe(gIf(config.isRelease, gulp.dest(config.dir.release)))
    .pipe(gIf(!config.isRelease, gulp.dest(config.dir.dest)))
    .pipe(bs.stream());
})


/*
 * タスク
 * 追加・変更があったJavaScriptのみをビルド先にコピー、コピー後はBrowserSyncを更新
 */
gulp.task('watch-js', function() {
   return gulp.src([config.dir.src + '/templates/assets/js/**/*.js', '!' + config.dir.src + '/templates/assets/js/**/_*.js'])
    .pipe(gChanged(config.dir.dest + '/assets/js'))
    .pipe(babel())
    .pipe(gulp.dest(config.dir.dest + '/assets/js'))
    .pipe(bs.stream());
});

gulp.task('watch-bundle-js', function() {
  return browserify({
          entries: config.dir.src + '/templates/assets/js/app.js',
          debug: true
        })
      .transform(babelify)
      .bundle()
      .on('error', gNotify.onError({
        message: "Error: <%= error.message %>",
        title: "Failed running browserify"
      }))
      .pipe(gPlumber())
      .pipe(source('bundle.js'))
      .pipe(gIf(!config.isRelease, gulp.dest(config.dir.dest + '/assets/js')))
      .pipe(gIf(config.isRelease, gulp.dest(config.dir.release + '/assets/js')))
      .pipe(bs.stream());
 });


/*
 * タスク
 * 追加・変更があったCSSのみをビルド先にコピー、コピー後はBrowserSyncを更新
 */
gulp.task('watch-css', function() {
  return gulp.src(config.dir.src + '/templates/assets/css/**/*.css')
    .pipe(gChanged(config.dir.dest + '/assets/css'))
    .pipe(gulp.dest(config.dir.dest + '/assets/css'))
    .pipe(bs.stream());
});

/*
 * タスク
 * 追加・変更があった画像のみをビルド先にコピー、コピー後はBrowserSyncを更新
 */
gulp.task('watch-img', function() {
  return gulp.src(config.dir.src + '/templates/assets/img/**/*.*')
    .pipe(gChanged(config.dir.dest + '/assets/img'))
    .pipe(gulp.dest(config.dir.dest + '/assets/img'))
    .pipe(bs.stream());
});


/*
 * タスク
 * BrowserSyncを起動する
 */
gulp.task('server', function() {
  bs({
    server: {
      baseDir: [config.dir.dest],
      directory: true,
      index: 'index.html'
    },
    port: 3000,
    notify: false
  });
});

/*
 * タスク
 * BrowserSyncを再読み込みする
 */
gulp.task('reload', function() {
  bs.reload();
});



/*
 * タスク
 * 初期化（ビルド先ディレクトリを削除する）
 * モードにより初期化対象を切り替え（devモード： dest、releaseモード：release）
 */
gulp.task('initialize', function() {
  let target = (config.isRelease) ? config.dir.release : config.dir.dest;
  return del(target);
});

/*
 * タスク
 * ビルド先ディレクトリに静的なファイルをコピーする
 */
gulp.task('copy', function() {
  // htmlのコピー
  gulp.src(config.dir.src + '/templates/**/*.+(html|htm)')
      .pipe(gIf(config.isRelease, gulp.dest(config.dir.release)))
      .pipe(gIf(!config.isRelease, gulp.dest(config.dir.dest)));

  // JavaScriptのコピー
  gulp.src([config.dir.src + '/templates/assets/js/**/*.js', '!' + config.dir.src + '/templates/assets/**/_*.js'])
      .pipe(gPlumber())
      .pipe(babel())
      .pipe(gIf(config.isRelease, gulp.dest(config.dir.release + '/assets/js')))
      .pipe(gIf(!config.isRelease, gulp.dest(config.dir.dest + '/assets/js')));

  // CSSのコピー
  gulp.src(config.dir.src + '/templates/assets/css/**/*.css')
      .pipe(gPlumber())
      // .pipe(gIf(config.isRelease, gCleanCSS()))
      .pipe(gIf(config.isRelease, gulp.dest(config.dir.release + '/assets/css')))
      .pipe(gIf(!config.isRelease, gulp.dest(config.dir.dest + '/assets/css')));

  // 画像のコピー
  gulp.src(config.dir.src + '/templates/assets/img/**/*.*')
      .pipe(gIf(config.isRelease, gulp.dest(config.dir.release + '/assets/img')))
      .pipe(gIf(!config.isRelease, gulp.dest(config.dir.dest + '/assets/img')));

  // フォントのコピー
  gulp.src(config.dir.src + '/templates/assets/fonts/**/*.*')
      .pipe(gIf(config.isRelease, gulp.dest(config.dir.release + '/assets/fonts')))
      .pipe(gIf(!config.isRelease, gulp.dest(config.dir.dest + '/assets/fonts')));

  // dataのコピー
  gulp.src(config.dir.src + '/templates/assets/data/**/*.*')
      .pipe(gIf(config.isRelease, gulp.dest(config.dir.release + '/assets/data')))
      .pipe(gIf(!config.isRelease, gulp.dest(config.dir.dest + '/assets/data')));

  // ライブラリのコピー
  gulp.src(config.dir.src + '/templates/assets/lib/**/*.*')
      .pipe(gIf(config.isRelease, gulp.dest(config.dir.release + '/assets/lib')))
      .pipe(gIf(!config.isRelease, gulp.dest(config.dir.dest + '/assets/lib')));
});

/*
 * タスク
 * プロジェクトに関連するファイルをビルドする
 */
gulp.task('build', function(done) {
  rs(
    'initialize',
    'copy',
    'sass',
    'ejs',
    'watch-bundle-js',
    done);
});

/*
 * タスク
 * 静的ファイル、Sassの監視
 */
gulp.task('watch', function() {
  gulp.watch(config.dir.src + '/scss/**/*.scss', ['sass']);
  gulp.watch(config.dir.src + '/templates/**/*.ejs', ['ejs']);
  gulp.watch(config.dir.src + '/templates/assets/img/**/*', ['watch-img']);
  gulp.watch(config.dir.src + '/templates/assets/js/**/*.js', ['watch-js']);
  gulp.watch(config.dir.src + '/templates/assets/js/**/*.js', ['watch-bundle-js']);
  gulp.watch(config.dir.src + '/templates/assets/css/**/*.css', ['watch-css']);
});

/*
 * タスク
 * Gulpの開始（ローカルサーバーを起動、監視を開始）
 */
gulp.task('default', ['build'], function(done) {
  gulp.start(['server', 'watch']);
});

/*
 * タスク
 * ファイルの納品
 */
gulp.task('release', function(done) {
  rs(
    'initialize',
    'ejs',
    'copy',
    'sass',
    'watch-bundle-js',
    done);
});