/**
 * This App file list all container display in Catalog
 * @author [ Alexis Jolin, Etienne Platini, Mathis Fasolo ]
 */


let fs = require('fs');


module.exports.getCatalog = function ()
{
    const pathToCatalogData = "./catalog/catalogData.json";
    let json = fs.readFileSync(pathToCatalogData);
    return JSON.parse(json);
};