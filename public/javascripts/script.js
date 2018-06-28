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
function displaySucess (sucess)
{
    // on fixe la limite de la fenetre a 5 element pour pas que le les erreurs décalent toute la page
    if($("#zoneError").children().length + 1 > 4)
    {
        $("#zoneError").css({"overflow-y": "scroll", "height" : "350px"});
    }
    // on crée une notification
    $("#zoneError").append(
        "<div class='alert-success alert-dismissible alert fade show' role='alert'>" +
        "<button class='close' type='button' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button>" +
        "<span class='notificationMessage'>"+sucess+"</span>" +
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
// Gestion des messages de notifications

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
// Management des Containers

$("#addNewContainer").click(function ()
{
    document.location.href="/container/addNewContainer/";
});


/**
 * Cette fonction lance l'annimation au clic sur le container
 * @param queryThis
 * @param boutonClick
 */
function toggleRunContainer(queryThis, boutonClick)
{
    let thisButton = queryThis;
    thisButton.parent().parent().find(".appStatus").find("svg").hide();
    thisButton.parent().parent().find(".appStatus").append(
        '<div class="spinner center">' +
            '<div class="double-bounce1"></div>' +
            '<div class="double-bounce2"></div>' +
        '</div>');
    thisButton.parent().hide();
    let URL = "";
    if(boutonClick === "RESTART") URL = "/container/restartContainer";
    else if(boutonClick === "START") URL = "/container/startContainer";
    else if(boutonClick === "STOP") URL = "/container/stopContainer";
    $.ajax({url: URL, type: "GET", success: function (result)
        {
            setTimeout(function ()
            {
                thisButton.parent().parent().find(".appStatus").find(".spinner").remove();
                thisButton.parent().parent().find(".appStatus").find("svg").show();
                if(boutonClick === "RESTART")
                {
                    thisButton.parent().parent().find(".appStatus").attr("title", "Stopped").find("circle").attr("fill", "green");
                    thisButton.parent().show();
                }
                else if(boutonClick === "START")
                {
                    thisButton.parent().parent().find(".appStatus").attr("title", "Running").find("circle").attr("fill", "green");
                    thisButton.hide();
                    thisButton.parent().show().find('.otherAction').show();
                    thisButton.parent().find('.stop').show();
                }
                else if(boutonClick === "STOP")
                {
                    thisButton.parent().parent().find(".appStatus").attr("title", "Running").find("circle").attr("fill", "red");
                    thisButton.hide();
                    thisButton.parent().show().find('.otherAction').hide();
                    thisButton.parent().find('.start').show();
                }
            }, 1000);

        }, error: function (err)
        {
            console.log(err);
            displayErrors(err);
        }});
}


$(".stop").click(function ()
{
    // animation
    toggleRunContainer($(this), "STOP");
   // appel ajax
    let containerName = $(this).attr("value");
    $.ajax({url:"/container/stopContainer/"+containerName, type: "GET", success: function (data)
        {
            console.log(data);
            displaySucess(data.responseJSON.msg);
            toggleRunContainer($(this), "START");

        }, error : function(err)
        {
            console.log(err);
            displayErrors(err.responseJSON.msg);
            toggleRunContainer($(this), "STOP");
        }})


});

$(".start").click(function ()
{
    // animation
    toggleRunContainer($(this), "START");
    // appel ajax
    let containerName = $(this).attr("value");
    $.ajax({url:"/container/startContainer/"+containerName, type: "GET", success: function (data)
        {
            console.log(data);
            displaySucess(data.responseJSON.msg);
            toggleRunContainer($(this), "STOP");

        }, error : function(err)
        {
            console.log(err);
            displayErrors(err.responseJSON.msg);
            toggleRunContainer($(this), "START");
        }})
});

$(".restart").click(function()
{
    // animation
    toggleRunContainer($(this), "RESTART");
    // appel ajax
    $.ajax({url:"/container/restartContainer/"+containerName, type: "GET", success: function (data)
        {
            displaySucess(data.responseJSON.msg);
            toggleRunContainer($(this), "START");

        }, error : function(err)
        {
            displayErrors(err.responseJSON.msg);
            toggleRunContainer($(this), "START");
        }})
});

/************************************/
// Gestion de la div modale

// ajoute
$(".chooseAContainer").click(function ()
{
   $("#container-type").val($(this).attr("id"));
});

$('#addAContainerName').on('shown.bs.modal', function ()
{
    $('#container-name').trigger('focus');

});