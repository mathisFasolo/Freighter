const {exec} = require('child_process');
let fs = require('fs');

//Build une image docker depuis un dockerfile
//@param
//dockerType : type d'image voulu (ex : nodejs, mongodb)
//name : nom à attribuer à l'image
function createDockerImage(req) {
        if (req.dockerType === "" || typeof req.dockerType === undefined) {
                console.log("their is no dockerType field");
                return {"err": "1", "msg": "no DockerType found"}
        }
        exec("docker build ./template/" + req.dockerType + " -t " + req.dockerType, (err, stdout, stderr) => {
                if (err) {
                        console.log(err);
                        return {"err": "2", "msg": "Failed to initialized docker"};
                } else {
                        return {"err": "0", "msg": "Docker Image succefully created"}
                }
        })

}


//Création d'un volume virtuelle
//@param
//dockerType : type d'image voulu (ex : nodejs, mongodb)
//name : nom du volume (même nom que l'image correspondante)
async function createVolume(req) {
        if (req.dockerType === "" || typeof req.dockerType === undefined) {
                console.log("their is no dockerType field");
                return {"err": "1", "msg": "no DockerType found"}
        }
        let catalog = await getCatalog();
        let i = 0;
        while (catalog.catalogContainer.length > i && req.dockerType != catalog.catalogContainer[i].type) {
                i++
        }
        if (i === catalog.catalogContainer.length) {
                return {"err": "1", "msg": "DockerType not existing into catalog"}
        }
        if (req.name === "" || typeof req.name === undefined) {
                console.log("their is no name field");
                return {"err": "1", "msg": "no name found"}
        }

        exec("docker volume create " + req.name, (err, stdout, stderr) => {
                if (err) {
                        console.log("Error occur during volume creation");
                        return {"err": "2", "msg": "Failed to create volume"}
                } else {
                        return {"err": "0", "msg": "Volume succefully created"}
                }
        })
}


//Lance un container de l'image passé en paramètre et monte le volume correspondant
//@param
//dockerType : type d'image voulu (ex : nodejs, mongodb)
//name : nom de l'image
async function startContainer(req) {
        let catalog = await getCatalog();
        let config = await getConfig();
        let cpuLimitation;
        let ramLimitation;
        let port;
        if (req.name === "" || typeof req.name === undefined) {
                console.log("their is no name field");
                return {"err": "1", "msg": "no name found"}
        }
        if (req.dockerType === "" || typeof req.dockerType === undefined) {
                console.log("their is no dockerType field");
                return {"err": "1", "msg": "no DockerType found"}
        }
        let i = 0;
        while (catalog.catalogContainer.length > i && req.dockerType != catalog.catalogContainer[i].type) {
                i++
        }
        if (i === catalog.catalogContainer.length) {
                return {"err": "15", "msg": "DockerType not existing into catalog"}
        }
        if (req.cpu === "" || !req.hasOwnProperty("cpu")) {
                console.log("no ram in req");
                cpuLimitation = catalog.catalogContainer[i].CPU_allowed_by_default;
        } else {
                cpuLimitation = req.cpu;
        }

        if (req.ram === "" || !req.hasOwnProperty("ram")) {
                console.log("no cpu in req");
                ramLimitation = catalog.catalogContainer[i].RAM_allowed_by_default;
        } else {
                ramLimitation = req.ram;
        }
        let p = 0;
        while (config.portList.lenght > p && !config.portList[p]) {
                p++;
        }
        if (p === config.portList.lenght) {
                return {"err": "20", "msg": "No more port to expose"}
        } else {
                port = 46000 + p;
        }
        exec("docker run --name " + req.name + " -m " + ramLimitation + " --cpus=" + cpuLimitation + " -p 127.0.0.1:" + port + ":8080 --mount source=" + req.name + ",target=/home  "+req.dockerType, (err, stdout, stderr) => {
                if (err) {
                        console.log(err);
                        return {"err": "2", "msg": "Failed to start container"}
                } else {
                        let docker = {
                                "_id": req.name,
                                "type": req.type,
                                "RAM_allowed": ramLimitation,
                                "CPU_allowed": cpuLimitation,
                                "port":port,
                                "deploy":true,
                                "pause":false,
                                "running": true
                        };
                        config.containersList.push(docker);
                        config.portList[p]=true;
                        putConfig(config);
                        return {"err": "0", "msg": "Container succefully start"}
                }
        })
}

//met un docker existant en pause
//@param
//name : nom du container à mettre en pause
async function pauseContainer(req) {
        let config = await getConfig();
        if (req.name === "" || typeof req.name === undefined) {
                console.log("their is no name field");
                return {"err": "1", "msg": "no name found"}
        }
        let i = 0;
        while( i < config.containersList.length && config.containersList[i]._id !== req.name){
                i++;
        }
        if(i === config.containersList.length){
                return {"err": "15", "msg": "This container does not exist"}
        }
        if(config.containersList[i].pause === true){
               return {"err": "11", "msg": "Container already in pause states"}
        }
        exec("docker pause " + req.name, (err, stdout, stderr) => {
                if (err) {
                        console.log("Error occur during container pause");
                        return {"err": "2", "msg": "Failed to pause container"}
                } else {
                        config.containersList[i].pause=true;
                        putConfig(config);
                        return {"err": "0", "msg": "Container succefully passed in paused"}
                }
        })
}

//relance un container mis en pause
//@param
//name : nom du container
async function unpauseContainer(req) {
        if (req.name === "" || typeof req.name === undefined) {
                console.log("their is no name field");
                return {"err": "1", "msg": "no name found"}
        }
        let config = await getConfig();
        let i = 0;
        while( i < config.containersList.length && config.containersList[i]._id !== req.name){
                i++;
        }
        if(i === config.containersList.length){
                return {"err": "15", "msg": "This container does not exist"}
        }
        if(config.containersList[i].pause === false){
                return {"err": "11", "msg": "Container already in running states"}
        }
        exec("docker pause " + req.name, (err, stdout, stderr) => {
                if (err) {
                        console.log("Error occur during docker pause");
                        return {"err": "2", "msg": "Failed to pause container"}
                } else {
                        config.containersList[i].pause = false;
                        putConfig(config);
                        return {"err": "0", "msg": "Container succefully passed in paused"}
                }
        })
}

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
        while( i < config.containersList.length && config.containersList[i]._id !== req.name){
                i++;
        }
        if(i === config.containersList.length){
                return {"err": "15", "msg": "This container does not exist"}
        }
        if(config.containersList[i].running === false){
                return {"err": "11", "msg": "Container already killed"}
        }
        exec("docker kill " + req.name, (err, stdout, stderr) => {
                if (err) {
                        console.log("Error occur during docker pause");
                        return {"err": "2", "msg": "Failed to kill container"}
                } else {
                        config.containersList[i].running=false;
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
        while( i < config.containersList.length && config.containersList[i]._id !== req.name){
                i++;
        }
        if(i === config.containersList.length){
                return {"err": "15", "msg": "This container does not exist"}
        }
        if(config.containersList[i].running === true){
                return {"err": "11", "msg": "Container already running"}
        }
        exec("docker restart " + req.name, (err, stdout, stderr) => {
                if (err) {
                        console.log("Error occur during docker pause");
                        return {"err": "2", "msg": "Failed to restart container"}
                } else {
                        config.containersList[i].running=true;
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
        while( i < config.containersList.length && config.containersList[i]._id !== req.name){
                i++;
        }
        if(i === config.containersList.length){
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
                                                        config.portList[46000-config.containersList[i].port]=false;
                                                        config.containersList.splice(i,1);
                                                        putConfig(config);
                                                        return {"err": "0", "msg": "Container succefully cleared"}
                                                }
                                        })
                                }
                        })

                }
        })
}

function getConfig() {
        return JSON.parse(fs.readFileSync('./config/containerConfig.json', 'utf8'));
}

function getCatalog() {
        return JSON.parse(fs.readFileSync('./template/catalog.json', 'utf8',));
}

function putConfig(config){
        let json = JSON.stringify(config);
        fs.writeFile('./config/containerConfig.json', json, 'utf8',  (err, data) => {
                if (err) {
                        console.log(err);
                        return {"err": "30", "msg": "Failed to write config"}
                } else {
                        return {"err": "0", "msg": "Config changed"}
                }
        });
}

