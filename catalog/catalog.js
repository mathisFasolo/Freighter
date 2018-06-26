/**
 * This App file list all container display in Catalog
 * @author [ Alexis Jolin, Etienne Platini, Mathis Fasolo ]
 */


let fs = require('fs');
let path = require('path');


module.exports.getCatalog = function ()
{
    const pathToCatalogData = path.join(__dirname,"catalogData.json");
    let json = fs.readFileSync(pathToCatalogData);
    return JSON.parse(json);
};