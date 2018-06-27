/**
 * This App file configures routing
 * @author [ Alexis Jolin, Etienne Platini, Mathis Fasolo ]
 */

let express = require('express');
const path = require('path');
let router = express.Router();
let sysManager = require(path.join(__dirname,"../system/systemRessourceManagement"));
let monitoringChart =  require(path.join(__dirname,"../visual/monitoringCharts"));
let util = require(path.join(__dirname,"../util.js"));
let catalog = require(path.join(__dirname,"../catalog/catalog"));
let containerManagement = require(path.join(__dirname,'../manageContainer/container.js'));

router
    .get('/', function(req, res, next)
    {
        // La page d'accueil : une page de chargement c'est une page esthétique
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
        // On récupère les containers installés
        let arrayContainers = containerManagement.getContainerInstalled();
        //  On attend les résultats des maitrics RAM et CPU pour afficher la page
        Promise.all([CPU, RAM_USED, RAM_SYS])
            .then(function(values)
            {
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

    .get('/container/addNewContainer/', function (req, res, next)
    {
        let pageTitle = "Choose your environment type";
        let arrayCatalog = catalog.getCatalog();
        res.render('catalog',{pageTitle: pageTitle, arrayContainerCatalog: arrayCatalog, chooseAContainer: true});
    })
    .post('/container/addNewContainer/create', function (req, res, next)
    {
        let containerType = req.body.containerType;
        let containerName = req.body.containerName;
        containerManagement.deployContainer(containerType, containerName)
            .then(function (data)
            {
                //res.send(res);
                let arrayContainers = containerManagement.getContainerInstalled();
                let pageTitle = 'My Dashboard';
                let CPU = sysManager.getCPU_USAGE();
                let RAM_USED = sysManager.getRAM_USED();
                let RAM_SYS = sysManager.getRAM_SYS();
                Promise.all([CPU, RAM_USED, RAM_SYS])
                    .then(function(values)
                    {
                        CPU = Number(values[0]).toFixed(2);
                        RAM_USED = values[1];
                        RAM_SYS = values[2];
                        res.render('index', {"CPU_USAGE" : CPU,"RAM_USAGE" : RAM_USED, "RAM_SYS" : RAM_SYS, "arrayContainer" : arrayContainers, pageTitle : pageTitle});
                    });
            })
            .catch(function (err)
            {
                console.log(err);
                //res.status(500).send(err)
            });

    })
    .get('/container/stopContainer/:name', function (req, res, next)
    {
        console.log("container stopped !");
        containerManagement.pauseContainer(req.params.name)
            .then(function (data)
            {
                res.send(data);
            })
            .catch(function (err)
            {
                console.log(err);
                res.status(500).send(err);
            });

    })
    .get('/container/startContainer/:name', function (req, res, next)
    {
        console.log("container started !");
        containerManagement.unpauseContainer(req.params.name)
            .then(function (data)
            {
                res.send(data);
            })
            .catch(function (err)
            {
                console.log(err);
                res.status(500).send(err);
            });
    })
    .get('/container/restartContainer/:name', function (req, res, next)
    {
        console.log("container restarted !");
        containerManagement.restart(req.params.name)
            .then(function (data)
            {
                res.send(data);
            })
            .catch(function (err)
            {
                console.log(err);
                res.status(500).send(err);
            });
    });

module.exports = router;
