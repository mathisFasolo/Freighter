/**
 * Ce fichier permet de logger un erreur dans un fichier txt
 * @author [ Alexis Jolin, Etienne Platini, Mathis Fasolo ]
 */

let fs = require('fs');
const pathToFileError = "./error.txt";

/**
 * permet d'enregistrer une erreur en paramettre dans un fichier de log : erreur.txt
 * @param error
 */
module.exports.logError = function (error)
{
    let errorLine = "- append on : " + new Date + " error logged : " + error + "\n";
    fs.appendFileSync(pathToFileError, errorLine);
};