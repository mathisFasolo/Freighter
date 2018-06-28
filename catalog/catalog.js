/**
 * This App file list all container display in Catalog
 * @author [ Alexis Jolin, Etienne Platini, Mathis Fasolo ]
 */


let fs = require('fs');
let path = require('path');

/**
 * Permet d'obtenir le tableau des environnement téléchargeables dans le fichier catalog.json
 * @returns {any}
 */
module.exports.getCatalog = function ()
{
    const pathToCatalogData = path.join(__dirname,"catalogData.json");
    let json = fs.readFileSync(pathToCatalogData);
    return JSON.parse(json);
};