/**
 * Ce fichier contient des modules utiles aux besoin de l'app n'entrant dans aucune catégorie
 * @returns {string}
 */

/**
 * génére un Identifiant string random
 * @returns {string}
 */
module.exports.generateRandomID = function ()
{
    return Math.random().toString(36).substr(2, 9);
};

