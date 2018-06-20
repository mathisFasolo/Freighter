/**
 * Ce fichier contient les fonctions de creation et de stockages des données de monitoring pour la creation de graphique
 * @author [ Alexis Jolin, Etienne Platini, Mathis Fasolo ]
 */

let fs = require('fs');

/**
 * Cette fonction récupère le fichier de sauvegarde des maitrics systeme CPU
 * et creer un tableau avec la date de la mesure et la valeur
 * @returns {Array}
 */
function getSaveCPU_USAGE()
{
    const pathCPUMaitrics = "./maitrics/data/cpu_usage.json";
    let arrayResult = [];
    let json = fs.readFileSync(pathCPUMaitrics, "utf8");
    json = JSON.parse(json);
    for(let maitrics in json.cpuMaitrics)
    {
        let tempMaitrics = json.cpuMaitrics[maitrics];
        let tempTimeStamp = tempMaitrics["time"];
        let tempDateObj = new Date(tempTimeStamp);
        let tempMinuteTime =
            {
                "y" : tempDateObj.getUTCFullYear(),
                "mt" : tempDateObj.getUTCMonth(),
                "d" : tempDateObj.getUTCDate(),
                "h" : tempDateObj.getHours(),
                "m" : tempDateObj.getMinutes()
            };
        arrayResult.push(
            {
                "date" : tempMinuteTime,
                "maitrics" : tempMaitrics.percent
            });
    }
    return arrayResult;
}

/**
 * Cette fonction récupère le fichier de sauvegarde des maitrics systeme RAM
 * et creer un tableau avec la date de la mesure et la valeur
 * @returns {Array}
 */
function getSaveRAM_USAGE()
{
    const pathRAMMaitrics = "./maitrics/data/ram_usage.json";
    let arrayResult = [];
    let json = fs.readFileSync(pathRAMMaitrics, "utf8");
    json = JSON.parse(json);
    for(let maitrics in json.ramMaitrics)
    {
        let tempMaitrics = json.ramMaitrics[maitrics];
        let tempTimeStamp = tempMaitrics["time"];
        let tempDateObj = new Date(tempTimeStamp);
        let tempMinuteTime =
            {
                "y" : tempDateObj.getUTCFullYear(),
                "mt" : tempDateObj.getUTCMonth(),
                "d" : tempDateObj.getUTCDate(),
                "h" : tempDateObj.getHours(),
                "m" : tempDateObj.getMinutes()
            };
        arrayResult.push(
            {
                "date" : tempMinuteTime,
                "maitrics" : tempMaitrics.percent
            });
    }
    return arrayResult;
}

/**
 * Cette fonction récupère les deux tableaux de mesure de RAM et de CPU
 * et retourne un tableau de tableaux associant un moment à sa mesure de RAM et sa mesure de CPU associée
 * @returns {Array}
 */
function compareMetricsToDisplay(arrayMaitricsRAM, arrayMaitricsCPU)
{
    let arrayTimeX = [];
    let arrayRAM = [];
    let arrayCPU = [];
    let saveCurrentTime; // sauvegarde le moment pour ne pas avoir plus d'un moment par minute
    for(let i in arrayMaitricsRAM)
    {
        for(let j in arrayMaitricsCPU)
        {
            // comparaison des moments et Annee mois jour heure et minute et verification : pas plus d'un moment par minute
            if( arrayMaitricsRAM[i].date.y == arrayMaitricsCPU[j].date.y &&
                arrayMaitricsRAM[i].date.mt == arrayMaitricsCPU[j].date.mt &&
                arrayMaitricsRAM[i].date.d == arrayMaitricsCPU[j].date.d &&
                arrayMaitricsRAM[i].date.h == arrayMaitricsCPU[j].date.h &&
                arrayMaitricsRAM[i].date.m == arrayMaitricsCPU[j].date.m &&
                JSON.stringify(arrayMaitricsRAM[i].date) !== JSON.stringify(saveCurrentTime))

            {
                saveCurrentTime =
                    {
                        "y" : arrayMaitricsRAM[i].date.y,
                        "mt" : arrayMaitricsRAM[i].date.mt,
                        "d" : arrayMaitricsCPU[j].date.d, "h" : arrayMaitricsRAM[i].date.h,
                        "m" : arrayMaitricsRAM[i].date.m
                    }; // sauvegarde du moment sous forme d'objet
                arrayTimeX.push(arrayMaitricsRAM[i].date.m);
                arrayRAM.push(arrayMaitricsRAM[i].maitrics);
                arrayCPU.push(arrayMaitricsCPU[j].maitrics);
            }
        }
    }
    // matrice de moment (abscisse) et deux tableaux de valeurs (deux courbes)
    return [arrayTimeX, arrayRAM, arrayCPU];
}

/**
 * Utilise les fonctions ci dessus pour creer un objet dont les propriétés correpsondent
 * à l'objet attendu par la library d'affichage Chart.js
 * @returns {Object}
 */
module.exports.initializeLineChart = function ()
{
    let arrayDisplayInfo = compareMetricsToDisplay(getSaveRAM_USAGE(),getSaveCPU_USAGE());
    let chartData =
        {
            type: 'line',
            data:
                {
                    datasets: [
                        {
                            label: 'CPU Usage',
                            data: arrayDisplayInfo[2],
                            backgroundColor: 'transparent',
                            borderColor: '#15214E',
                            borderWidth: 3,
                            pointBorderColor: '#EF5822'
                        },
                        {
                            label: 'RAM Usage',
                            data: arrayDisplayInfo[1],
                            backgroundColor: 'transparent',
                            borderColor: '#EF5822',
                            borderWidth: 3,
                            pointBorderColor: '#15214E'
                        }],
                    labels: arrayDisplayInfo[0]
                },
            options:
                {
                    responsive: true,
                    elements: {
                        line: {tension: 0}
                    },
                    scales: {
                        yAxes: [{
                            ticks:
                                {
                                    beginAtZero: true,
                                    fontFamily: 'IBM Plex Sans',
                                    fontSize: 15
                                }
                        }],
                        xAxes: [{
                            ticks:
                                {
                                    beginAtZero: true,
                                    fontFamily: 'IBM Plex Sans',
                                    fontSize: 15
                                }
                        }]
                    }
                }
        };
    return chartData;
};