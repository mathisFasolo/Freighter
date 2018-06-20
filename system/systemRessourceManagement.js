/**
 * Ce fichier contient les fonctions de monitoring systeme utiles au tracage de l'activité de l'OS
 * @author [ Alexis Jolin, Etienne Platini, Mathis Fasolo ]
 */

// GET SYSTEM ACTIVITY
let os_util = require('os-utils');
let os = require('os');
// FILE SYSTEM
let fs = require('fs');

/**
 * Cette fonction retourne le pourcentage de CPU utilisé via un mécanisme de Promise
 * @returns {Promise<any>}
 */
module.exports.getCPU_USAGE = function ()
{
    return new Promise(function(resolve, reject)
    {
        os_util.cpuUsage(function(CPU_USAGE)
        {
            if(CPU_USAGE !== undefined) resolve(CPU_USAGE);
            else reject(-1);
        });
    });
};

/**
 * Cette fonction retourne la quantité de RAM installée sur la machine
 * @returns {Promise<any>}
 */
module.exports.getRAM_SYS = function ()
{
  return new Promise(function (resolve, reject)
  {
      let RAM_TOTAL = os.totalmem()/1073741824;
      if(RAM_TOTAL !== undefined)   resolve(RAM_TOTAL);
      else reject(-1);
  });
};

/**
 * Cette fonction retourne la quantité de RAM utilisée par le systéme
 * @returns {Promise<any>}
 */
module.exports.getRAM_USED = function ()
{
  return new Promise(function (resolve, reject)
  {
      let RAM_TOTAL = os.totalmem();
      let RAM_FREE = os.freemem();
      let RAM_USED = RAM_TOTAL - RAM_FREE;
      RAM_USED = RAM_USED/1073741824; // converti Bytes en Gigabytes
      RAM_USED = RAM_USED.toFixed(0);
      console.log("TOTAL : " + RAM_TOTAL + " - FREE : " + RAM_FREE + " = " + RAM_USED);
      if(RAM_USED !== undefined) resolve(RAM_USED);
      else reject(-1);
  });
};

/**
 * Cette fonction retourne l'usage de la RAM par le systeme en pourcentage
 * @returns {Promise<any>}
 */
module.exports.getRAM_USAGE = function ()
{
    let RAM_USED = this.getRAM_USED();
    let RAM_SYS = this.getRAM_SYS();
    return new Promise(function (resolve, reject)
    {
      Promise.all([RAM_USED, RAM_SYS])
          .then(function (values)
          {
              let RAM_USAGE = (values[0] / values[1])*100;
              resolve(RAM_USAGE);
          })
          .catch(function (err)
          {
            reject(err);
          });
    })
};

module.exports.saveRAM_USAGE = function ()
{
    let filePath = "./maitrics/data/ram_usage.json";
    this.getRAM_USAGE().then(function (RAM_USAGE)
    {
        try
        {
            let savConso =
            {
                time : Date.now(),
                percent : RAM_USAGE,
                type : "SYSTEM_GENERAL"
            };
            let buffer = fs.readFileSync(filePath, "utf8");
            let json = JSON.parse(buffer);
            let arrayMaitrics = json["ramMaitrics"];
            arrayMaitrics.push(savConso);
            json.ramMaitrics = arrayMaitrics;
            fs.writeFileSync(filePath, JSON.stringify(json));
        }
        catch(err) {   console.log(err);   }
    }).catch(function (err)
    {
        console.log(err);
    });
};

module.exports.saveCPU_USAGE = function ()
{
    let filePath = "./maitrics/data/cpu_usage.json";
    this.getCPU_USAGE().then(function (CPU_USAGE)
    {
        try
        {
           let savConso =
               {
                   time : Date.now(),
                   percent : CPU_USAGE,
                   type : "SYSTEM_GENERAL"
               };
            let buffer = fs.readFileSync(filePath, "utf8");
            let json = JSON.parse(buffer);
            let arrayMaitrics = json["cpuMaitrics"];
            arrayMaitrics.push(savConso);
            json.cpuMaitrics = arrayMaitrics;
            fs.writeFileSync(filePath, JSON.stringify(json));
        }
        catch(err) {   console.log(err);   }
    }).catch(function (err)
    {
        console.log(err);
    });
};