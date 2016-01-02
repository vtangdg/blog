var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var flash = require('connect-flash');

var routes = require('./routes/index');
var settings = require('./settings');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');



// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// 使用express-session和connect-mongo模块实现将会话信息存储到mongodb中,以防丢失
app.use(session({
  secret:settings.cookieSecret,// secret 用来防止篡改 cookie
  key: settings.db,
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},// 生存周期30天
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({
    url: "mongodb://" + settings.host + "/" + settings.db
  })
}));

// flash 是一个在 session 中用于存储信息的特定区域。信息写入 flash ，下一次显示完毕后即被清除。典型的应用是结合重定向的功能，确保信息是提供给下一个被渲染的页面。
app.use(flash());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);




module.exports = app;
