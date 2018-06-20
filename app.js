/**
 * This App file defines the dependencies and init the web app
 * @author [ Alexis Jolin, Etienne Platini, Mathis Fasolo ]
 */

let createError = require('http-errors');
// This app uses the Framework express
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let sassMiddleware = require('node-sass-middleware');
let CronJob = require('cron').CronJob;
let maitrics = require('./system/systemRessourceManagement');


let indexRouter = require('./routes/index');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//app.use(express.bodyParser());
app.use(cookieParser());
app.use(sassMiddleware(
    {
        src: path.join(__dirname, 'public'),
        dest: path.join(__dirname, 'public'),
        indentedSyntax: false, // SCSS File
        sourceMap: true
    }));
app.use(express.static(path.join(__dirname, 'public')));

// shedule each 5 second a savegard of RAM and CPU usage to display maitrics
let job = new CronJob(
    {
        cronTime: '*/30 */2 * * * *',
        onTick: function()
        {
            console.log("working");
            //maitrics.saveRAM_USAGE();
            //maitrics.saveCPU_USAGE();
        },
        start: false,
        timeZone: 'Europe/Paris'
});
job.start();

// the app uses routes defined in indexRouter ...
app.use('/', indexRouter);
// ... and if url are not includes in routes array, catch 404 and forward to error handler
app.use(function(req, res, next)
{
    next(createError(404));
});


// Internal Server Error gestion with a new view and error statut code
app.use(function(err, req, res, next)
{
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
