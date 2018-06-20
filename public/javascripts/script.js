/**
 * Main Script File of Freigther
 * Contains AJAXs calls,  notifications functions and style tweaks
 *
 * @author Alexis jolon Etienne Platini Mathis Fasolo
 *
 */


/************************************/
// Fonctions utiles au script

/**
 * Cette fonction permet de construire une notification d'erreur et de l'afficher dans la zone prévue à cet effet
 * @param error
 */
function displayErrors (error)
{
    // on fixe la limite de la fenetre a 5 element pour pas que le les erreurs décalent toute la page
    if($("#zoneError").children().length + 1 > 4)
    {
        $("#zoneError").css({"overflow-y": "scroll", "height" : "350px"});
    }
    // on crée une notification
    $("#zoneError").append(
            "<div class='alert-danger alert-dismissible alert fade show' role='alert'>" +
            "<button class='close' type='button' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>" +
            "<span class='notificationMessage'>"+error+"</span>" +
            "</div>");
    let notificationsCounter = $("#zoneError").children().length;
    $("#notificationBadge").text(notificationsCounter).show();
}

/************************************/
// Fonctions AJAX exécutées durant la vie de la page

/**
 * Cette fonction charge via requette AJAX au server le graphique de monitoring d'activité au lancement de la page
 */
$(document).ready(function ()
{

    $.ajax({url:"/maitrics/getChart", type: "GET", success: function (result)
        {
            let ctx = document.getElementById("myChart");
            let myChart = new Chart(ctx,JSON.parse(result));
        }, error: function (err)
        {
            displayErrors("Impossible d'afficher le graphique : " + err)
        }});
});

/**
 * Cette fonction met a jour toute les 5 secondes les informations de monitoring de CPU
 */
setInterval(function()
{
    $.ajax({url: "/repeatManager/cpu", type: "GET", success: function (result)
        {
            if(result<=50)   $("#cpuUsage").removeClass('importantData').text(result);
            else $("#cpuUsage").addClass("importantData").text(result);
        }, error: function (err)
        {
            console.log(err);
            displayErrors(err.responseText);
        }});
}, 1000 * 5);

/**
 * Cette fonction met a jour toute les 60 secondes les informations de monitoring de RAM
 */

setInterval(function()
{
    $.ajax({url: "/repeatManager/ram", type: "GET", success: function (result)
        {
            if(result<=80)   $("#ramUsage").removeClass('importantData').text(result);
            else $("#ramUsage").addClass("importantData").text(result);
        }, error: function (err)
        {
            console.log(err);
            displayErrors(err.responseText);
        }});
}, 1000 * 60);

/************************************/
// notifications

$("#notification")
    .click(function ()
    {
        $(this).hide();
        $("#notification_off").show();
        $("#zoneError").html("");
    });

$("#notification_off")
    .click(function ()
    {
       $(this).hide();
       $("#notification").hide();
    });


/************************************/
// TODO Manage Container

$("#addNewContainer").click(function ()
{
    document.location.href="/addNewContainer/";
});

/*$(".envContainer").click(function ()
{
    //document.location.href="/viewContainer/"+$(this).attr("value");
    displayErrors(["problème"]);
});*/

$(".stop").click(function ()
{
    let thisStopButton = $(this);
    $.ajax({url: "/container/stopContainer", type: "GET", success: function (result)
       {
           thisStopButton.parent().parent().find(".appStatus").attr("title", "Stopped").find("circle").attr("fill", "red");
           thisStopButton.parent().find('.otherAction').hide();
           thisStopButton.hide();
           thisStopButton.parent().find('.start').show();
       }, error: function (err)
       {
           console.log(err);
           displayErrors(err.responseText);
       }});
});

$(".start").click(function ()
{
    let thisStartButton = $(this);
    $.ajax({url: "/container/startContainer", type: "GET", success: function (result)
        {
            thisStartButton.parent().parent().find(".appStatus").attr("title", "Stopped").find("circle").attr("fill", "green");
            thisStartButton.parent().find('.otherAction').show();
            thisStartButton.hide();
            thisStartButton.parent().find('.stop').show();
        }, error: function (err)
        {
            console.log(err);
            displayErrors(err.responseText);
        }});
});

$("#restart").click(function ()
{

});
