/**
 * Ce fichier permet de logger un erreur dans un fichier txt
 * @author [ Alexis Jolin, Etienne Platini, Mathis Fasolo ]
 */

let fs = require('fs');
const pathToFileError = "./error.txt";

module.exports.logError = function (error)
{
    let errorLine = "- append on : " + new Date + " error logged : " + error + "\n";
    fs.writeFileSync(pathToFileError, errorLine);
};