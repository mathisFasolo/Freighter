/**
 * container.js contient les informations utile à la gestion des containers docker
 * (pull d'image, creation de container et de volume virtuel, enregistrement dans la base de donnée de l'app ...)
 * @author [ Alexis Jolin, Etienne Platini, Mathis Fasolo ]
 */

// permet d'executer une commande système depuis nodejs
const {exec} = require('child_process');
// le module de gestion de fichier sous node js
let fs = require('fs');
// ce module gére les chemins dans l'application
let path = require('path');
let catalogue = require('../catalog/catalog.js');
let util = require('../util.js');
let errorLogger = require('../error.js');


/**
 * Cette fonction obtien une image docker depuis le docker hub en fonction d'un docker file pré crée
 * Il s'agit en quelque sorte du catalogue docker de notre application
 * Il monte l'image pour servir de base à la creation du container (image = type de container)
 * @param containerType
 * @returns {Promise<any>}
 */
function createDockerImage(containerType) {
    return new Promise(function (resolve, reject) {
        if (containerType === "" || containerType === undefined) {
            console.log("their is no dockerType field");
            errorLogger.logError("unable to create docker image : their is no dockerType field");
            reject({err: 1, msg: "no DockerType found"});
        }
        let catalog = catalogue.getCatalog();
        let i = 0;
        while (catalog.length > i && containerType != catalog[i].type) {
            i++
        }
        if (i === catalog.length) {
            reject({err: 1, msg: "DockerType not existing into catalog"});
        }
        exec("docker build "+path.join(__dirname,'template/') +""+ containerType + " -t " + containerType, (err, stdout, stderr) => {
            if (err) {
                console.log(err);
                errorLogger.logError("unable to create docker image : " + err);
                reject({err: 2, msg: "Failed to initialized docker"});
            }
            else {
                console.log(stdout);
                resolve({err: 0, msg: "Docker Image succefully created"});
            }
        })
    });

}

/**
 * Cette fonction cree un volume docker virtuel qui pourra etre attaché a un container
 * Ce volume permet de ne pas perdre les données du container en cas d'arret ou de suppression
 * @param containerType
 * @param containerName
 * @returns {Promise<any>}
 */
function createVolume(containerType, containerName) {
    return new Promise(function (resolve, reject) {
        if (containerType === "" || containerType === undefined) {
            console.log("their is no dockerType field");
            errorLogger.logError("unable to create docker volume : their is no dockerType field");
            reject({err: 1, msg: "no DockerType found"});
        }
        let catalog = catalogue.getCatalog();
        let i = 0;
        while (catalog.length > i && containerType != catalog[i].type) {
            i++
        }
        if (i === catalog.length) {
            reject({err: 1, msg: "DockerType not existing into catalog"});
        }
        if (containerName === "" || containerName === undefined) {
            console.log("their is no name field");
            errorLogger.logError("unable to create docker volume : their is no name field");
            reject({err: 1, msg: "no name found"});
        }

        exec("docker volume create " + containerName, (err, stdout, stderr) => {
            if (err) {
                console.log("Error occur during volume creation");
                errorLogger.logError("unable to create docker volume : " + err);
                reject({err: 2, msg: "Failed to create volume"});
            } else {
                resolve({err: 0, msg: "Volume succefully created"});
            }
        })
    });
}

/**
 * Cette fonction permet de lancer un container docker avec docker run en fonction de l'image passé en paramètre
 * met en place un volume deja créé
 * @param containerType
 * @param containerName
 * @param cpu (optionnel)
 * @param ram (optionnel)
 * @returns {Promise<any>}
 */
function startContainer(containerType, containerName, cpu, ram) {
    return new Promise(function (resolve, reject) {
        let catalog = catalogue.getCatalog();
        let config = getSystemConfig();
        let cpuLimitation;
        let ramLimitation;
        let port;
        let arrayPortLength = Object.keys(config.portList).length;
        if (containerName === "" || containerName === undefined) {
            console.log("their is no name field");
            errorLogger.logError("unable to start container : their is no name field");
            reject({err: 1, msg: "no name found"});
        }
        if (containerType === "" || containerType === undefined) {
            errorLogger.logError("unable to start container : their is no type field");
            console.log("their is no dockerType field");
            reject({err: 1, msg: "no DockerType found"});
        }
        let i = 0;
        while (catalog.length > i && containerType != catalog[i].type) {
            i++
        }
        if (i === catalog.length) {
            reject({err: 15, msg: "DockerType not existing into catalog"});
        }
        if (cpu === "" || cpu === undefined) {
            cpuLimitation = catalog[i].CPU_allowed_by_default;
        } else {
            cpuLimitation = cpu;
        }

        if (ram === "" || ram === undefined) {
            ramLimitation = catalog[i].RAM_allowed_by_default;
        } else {
            ramLimitation = ram;
        }
        let p = 0;
        while (arrayPortLength > p && config.portList[p] === true) {
            p++;
        }
        if (p === arrayPortLength) {
            reject({err: 20, msg: "No more port to expose"});
        } else {
            port = 46000 + p;
        }
        let cmd = "docker run -d --name " + containerName + " -m " + ramLimitation + " --cpus=" + cpuLimitation + " -p " + port + ":8080 --expose=8080 --mount source=" + containerName + ",target=/home  " + containerType;
        exec(cmd, (err, stdout, stderr) => {
            if (err) {
                reject({err: 2, msg: "Failed to start container"});
            } else {
                let docker = {
                    "id": util.generateRandomID(),
                    "nameApp": containerName,
                    "type": containerType,
                    "RAM_allowed": ramLimitation,
                    "CPU_allowed": cpuLimitation,
                    "port": port,
                    "deploy": true,
                    "isStarted": true,
                    "running": true
                };
                config.containersList.push(docker);
                config.portList[p] = true;
                putConfig(config);
                resolve({err: 0, msg: "Container succefully start"});
            }
        })
    });
}

/**
 * Permet de creer un container par la création de son image de son volume associé
 * et start un container depuis cette image
 * @param typeContainer
 * @param nameContainer
 * @param cpu (optionnel)
 * @param ram (optionnel)
 * @returns {Promise<*>}
 */
module.exports.deployContainer = function (typeContainer, nameContainer, cpu, ram)
{
    return new Promise(function (resolve, reject)
    {
        createDockerImage(typeContainer)
            .then(function ()
            {
                createVolume(typeContainer, nameContainer)
                    .then(function ()
                    {
                        startContainer(typeContainer, nameContainer, cpu, ram)
                            .then(function ()
                            {
                                resolve({err: 0, msg: "Container succefully created and started"});
                            })
                            .catch(function (err)
                            {
                                reject(err);
                            });
                    })
                    .catch(function (err) {
                        reject(err);
                    });
            })
            .catch(function (err) {
                reject(err);
            });
    });

};

/**
 * Permet de mettre en pause et de relencer directement un container
 * @param nameContainer
 */
module.exports.restart=function(nameContainer)
{
    return new Promise (function (resolve, reject)
    {
        this.pauseContainer(nameContainer).then(function()
        {
            this.unpauseContainer(nameContainer).then(function()
            {
                resolve({err: 0, msg: "Container succefully created and started"});
            }).catch(function (err)
            {
                reject(err);
            })
        }).catch(function (err)
        {
            reject(err);
        });
    });
};

//met un docker existant en pause
//@param
//name : nom du container à mettre en pause
module.exports.pauseContainer = function (nameContainer) {
    return new Promise(function (resolve, reject) {
        let config = getSystemConfig();
        if (nameContainer === "" || nameContainer === undefined) {
            errorLogger.logError("their is no name field");
            reject({err: 1, msg: "no name found"});
        }
        let i = 0;
        while (i < config.containersList.length && config.containersList[i].nameApp !== nameContainer) {
            i++;
        }
        if (i === config.containersList.length) {
            errorLogger.logError("unable to pause container : " + nameContainer + " this container does not exist");
            reject({err: 15, msg: "This container does not exist"});
        }
        if (config.containersList[i].isStarted === true) {
            errorLogger.logError("unable to pause container : " + nameContainer + " container already in pause states");
            reject({err: 11, msg: "Container already in pause states"});
        }
        getContainerIDByName(nameContainer).then (function (data) {
            console.log("docker pause " + data.msg);
            exec("docker pause " + data.msg, (err, stdout, stderr) => {
                if (err) {
                    console.log("Error occur during container pause");
                    errorLogger.logError("unable to pause container : " + nameContainer + " error occur during container pause");
                    reject({err: 2, msg: "Failed to pause container"});
                } else {
                    config.containersList[i].isStarted = false;
                    putConfig(config);
                    resolve({err: 0, msg: "Container succefully passed in paused"});
                }
            })
        }).catch(function (err) {
            reject(err);
        })
    })
};

//relance un container mis en pause
//@param
//name : nom du container
module.exports.unpauseContainer = function (nameContainer) {
    return new Promise(function (resolve, reject) {
        if (nameContainer === "" || nameContainer === undefined) {
            console.log("their is no name field");
            reject ({err: 1, msg: "no name found"});
        }
        let config = getSystemConfig();
        let i = 0;
        while (i < config.containersList.length && config.containersList[i].nameApp !== nameContainer) {
            i++;
        }
        if (i === config.containersList.length) {
            reject({err: 15, msg: "This container does not exist"});
        }
        if (config.containersList[i].isStarted === false) {
            reject ({err: 11, msg: "Container already in running states"});
        }
        getContainerIDByName(nameContainer).then (function (data) {
            console.log("docker unpause " + data.msg);
            exec("docker unpause " + data.msg, (err, stdout, stderr) => {
                if (err) {
                    console.log("Error occur during container pause");
                    errorLogger.logError("unable to pause container : " + nameContainer + " error occur during container pause");
                    reject({err: 2, msg: "Failed to pause container"});
                } else {
                    config.containersList[i].isStarted = true;
                    putConfig(config);
                    resolve({err: 0, msg: "Container succefully unpaused"});
                }
            })
        }).catch(function (err) {
            reject(err);
        })
    })
};

//kill les process d'un container
//@param
//name : nom de container à kill
async function killContainer(req) {
    if (req.name === "" || typeof req.name === undefined) {
        console.log("their is no name field");
        return {"err": "1", "msg": "no name found"}
    }
    let config = await getConfig();
    let i = 0;
    while (i < config.containersList.length && config.containersList[i]._id !== req.name) {
        i++;
    }
    if (i === config.containersList.length) {
        return {"err": "15", "msg": "This container does not exist"}
    }
    if (config.containersList[i].running === false) {
        return {"err": "11", "msg": "Container already killed"}
    }
    exec("docker kill " + req.name, (err, stdout, stderr) => {
        if (err) {
            console.log("Error occur during docker pause");
            return {"err": "2", "msg": "Failed to kill container"}
        } else {
            config.containersList[i].running = false;
            putConfig(config);
            return {"err": "0", "msg": "Container succefully kill"}
        }
    })
}

//restart un container kill ou planté
//@param
//name : nom du container à relancer
async function restartContainer(req) {
    if (req.name === "" || typeof req.name === undefined) {
        console.log("their is no name field");
        return {"err": "1", "msg": "no name found"}
    }
    let config = await getConfig();
    let i = 0;
    while (i < config.containersList.length && config.containersList[i]._id !== req.name) {
        i++;
    }
    if (i === config.containersList.length) {
        return {"err": "15", "msg": "This container does not exist"}
    }
    if (config.containersList[i].running === true) {
        return {"err": "11", "msg": "Container already running"}
    }
    exec("docker restart " + req.name, (err, stdout, stderr) => {
        if (err) {
            console.log("Error occur during docker pause");
            return {"err": "2", "msg": "Failed to restart container"}
        } else {
            config.containersList[i].running = true;
            putConfig(config);
            return {"err": "0", "msg": "Container succefully restart"}
        }
    })
}

//Supprime le container, son image et le volume associé
//@param
//name: nom du container à supprimer
async function deleteContainer(req) {
    if (req.name === "" || typeof req.name === undefined) {
        console.log("their is no name field");
        return {"err": "1", "msg": "no name found"}
    }
    let config = await getConfig();
    let i = 0;
    while (i < config.containersList.length && config.containersList[i]._id !== req.name) {
        i++;
    }
    if (i === config.containersList.length) {
        return {"err": "15", "msg": "This container does not exist"}
    }
    exec("docker rm " + req.name, (err, stdout, stderr) => {
        if (err) {
            console.log("Error occur during docker delete");
            return {"err": "2", "msg": "Failed to delete container"}
        } else {
            exec("docker image rm " + req.name, (err, stdout, stderr) => {
                if (err) {
                    return {"err": "2", "msg": "Failed to delete docker image"}
                } else {
                    exec("docker volume rm " + req.name, (err, stdout, stderr) => {
                        if (err) {
                            return {"err": "2", "msg": "Failed to delete docker volume"}
                        } else {
                            config.portList[46000 - config.containersList[i].port] = false;
                            config.containersList.splice(i, 1);
                            putConfig(config);
                            return {"err": "0", "msg": "Container succefully cleared"}
                        }
                    })
                }
            })

        }
    })
}


function getSystemConfig() {
    return JSON.parse(fs.readFileSync(path.join(__dirname,"../system/containerConfig.json"), 'utf8'));
}

function putConfig(config) {
    let json = JSON.stringify(config);
    let filepath = path.join(__dirname,'../system/containerConfig.json');
    fs.writeFileSync(filepath, json, 'utf8');
}

module.exports.getContainerInstalled = function () {
    const pathToContainerList = path.join(__dirname,"../system/containerConfig.json");
    let json = JSON.parse(fs.readFileSync(pathToContainerList, 'utf8'));
    return json.containersList;
};

function getContainerIDByName(containerName){
    return new Promise(function (resolve, reject) {
        exec("docker ps -aqf \"name=" + containerName + "\"", (err, stdout, stderr) => {
            if (err) {
                console.log(err);
                reject ({"err": "2", "msg": "Failed to get dockerID"});
            } else {
                console.log(stdout);
                resolve ({"err": "0", "msg": stdout})
            }
        })
    })
}

