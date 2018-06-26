/**
 * This App file configures routing
 * @author [ Alexis Jolin, Etienne Platini, Mathis Fasolo ]
 */

let express = require('express');
let router = express.Router();
let os = require("os");
let sysManager = require("../system/systemRessourceManagement");
let monitoringChart =  require("../visual/monitoringCharts");
let util = require("../util.js");
let catalog = require("../catalog/catalog");
let containerManagement = require('../manageContainer/container.js');

router
    .get('/', function(req, res, next)
    {
        // App main page : a loading page
        let arrayLoading = ["Loading User Preferences", "Loading Containers", "Loading Platform Interface"];
        res.render('loading', {"arrayLoading" : arrayLoading });
    })
    .get('/dashboard', function (req, res, next)
    {
        // the dashboard start page
        let CPU = sysManager.getCPU_USAGE();
        let RAM_USED = sysManager.getRAM_USED();
        let RAM_SYS = sysManager.getRAM_SYS();
        let pageTitle = 'My Dashboard';
        // TODO get all containers
        let cryptoPoly =
            {
                id: util.generateRandomID(),
                nameApp: "CryptoPoly",
                typeApp: "NodeJS",
                isStarted: true,
                infoTextApp: "Lorem Ipsum Doloris ..."
            };
        //let arrayContainers = [cryptoPoly, cryptoPoly, cryptoPoly];
        let arrayContainers = containerManagement.getContainerInstalled();
        Promise.all([CPU, RAM_USED, RAM_SYS])
            .then(function(values)
            {
                // round number at 2 decimal
                CPU = Number(values[0]).toFixed(2);
                RAM_USED = values[1];
                RAM_SYS = values[2];
                res.render('index', {"CPU_USAGE" : CPU,"RAM_USAGE" : RAM_USED, "RAM_SYS" : RAM_SYS, "arrayContainer" : arrayContainers, pageTitle : pageTitle});
            });

    })
    .get('/catalog', function (req, res, next)
    {
        let pageTitle = "Catalog";
        let arrayCatalog = catalog.getCatalog();
        res.render('catalog',{pageTitle: pageTitle, arrayContainerCatalog: arrayCatalog});
    })
    .get('/repeatManager/cpu', function (req, res, next)
    {
        // Appel AJAX, met a jour les informations de mesures en temps réel de l'activité du CPU
        sysManager.getCPU_USAGE()
            .catch(function (err)
            {
                res.status(500).send(err);
            })
            .then(function(data)
            {
                let CPU_USAGE = Number(data).toFixed(2);
                res.end(CPU_USAGE);
            });
    })
    .get('/repeatManager/ram', function (req, res, next)
    {
        sysManager.getRAM_USED()
            .catch(function (err)
            {
                res.status(500).send(err);
            })
            .then(function (data)
            {
                let RAM_USAGE = Number(data).toFixed(0);
                res.end(RAM_USAGE);
            })
    })
    .get('/maitrics/getChart', function (req, res, next)
    {
        // Appel AJAX, charge le graphique au démarrage du système
        let chartJSON = monitoringChart.initializeLineChart();
        let chart = JSON.stringify(chartJSON);
        res.send(chart);
    })
    .get('/container/viewContainer/:idContainer', function (req,res,next)
    {
        let idContainer = req.params.idContainer;
        // TODO get info container by ID
        let cryptoPoly =
            {
                id: util.generateRandomID(),
                nameApp: "CryptoPoly",
                typeApp: "NodeJS",
                isStarted: true,
                infoTextApp: "Lorem Ipsum Doloris ...",
                url: "www.google.com",
            };
        cryptoPoly.ramUsage = 1000;
        cryptoPoly.cpuUsage = 5;
        res.render('exploreContainer', {"container" : cryptoPoly});
    })
    .get('/container/addNewContainer/', function (req, res, next)
    {
        /*console.log(util.generateRandomID());
        let arrayCatalog = [
            {
                nameContainer: "Ubuntu"
            }];
        let containerType = "test";
        let containerName = "Jeuj3";
        containerManagement.deployContainer(containerType, containerName);
        // TODO get catalog page
        containerManagement;*/
        let pageTitle = "Choose your environment type";
        let arrayCatalog = catalog.getCatalog();
        res.render('catalog',{pageTitle: pageTitle, arrayContainerCatalog: arrayCatalog});
    })
    .get('/container/addNewContainer/create/:name', function (req, res, next)
    {
        let containerType = req.params.name;
        let containerName = "COUCOU";
        containerManagement.deployContainer(containerType, containerName)
            .then(function (res)
            {
                res.send(res);
            })
            .catch(function (err)
            {
                res.status(500).send(err)
            });
    })
    .get('/container/stopContainer', function (req, res, next)
    {
        console.log("container stopped !");
        // TODO  appel fonction container
        res.send(true);
    })
    .get('/container/startContainer', function (req, res, next)
    {
        console.log("container started !");
        // TODO appel fonction container
        res.send(true);
    })
    .get('/container/restartContainer', function (req, res, next)
    {
        console.log("container restarted !");
        // TODO appel fonction container
        res.send(true);
    });

module.exports = router;
