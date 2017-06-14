var players;

$(function() {
    //alert('pagina cargada');
    // Botones de la paginación
    var botonesPaginacion = $('ul.pagination>li');
    // Botón "Siguiente"
    var botonSiguiente = $(botonesPaginacion[botonesPaginacion.length - 2]).find('a');
    // Pulsar al cargar
    
    $(botonSiguiente).bind("click", function() {
        if (calculaPuntos()) {
            alert(mapToJson(players));
            console.info(players)
            localStorage.removeItem('savedPlayers');
        }
    });
    //setTimeout($(botonSiguiente).trigger("click"), 10000);
    //$(botonSiguiente).trigger("click");
})

function mapToJson(map) {
    return JSON.stringify([...map]);
}

function jsonToMap(jsonStr) {
    return new Map(JSON.parse(jsonStr));
}

function initializePlayersMap() {
    var userRows = $('table.standings.table.condensed>tbody>tr');
    var map = new Map();
    userRows.each(function (index) {
        var name = $(userRows[index]).find('td.name.text-left>a').text().trim();
        var points = $(userRows[index]).find('td.points.text-right>strong').text().trim();
        map.set(name, 20000000 + (parseInt(points) * 60000));
    });
    return map;
}

function finCalculo() {
    var fin = false;
    var noticias = $('h3.subject');
    noticias.each(function (index) {
       if ($(noticias[index]).text() == "Liga reiniciada") {
           fin = true;
       }
    });
    return fin;
}

function calculaPuntos() {
    players = new Map();
    var json = "";
    var category = "";
    var vendedorDesde = 0;
    var vendedorHasta = 0;
    var vendedor = "";
    var compradorDesde = 0;
    var compradorHasta = 0;
    var comprador = "";
    var precioDesde = 0;
    var precioHasta = 0;
    var precio;
    var saldo;

    if (localStorage.getItem('savedPlayers')  == undefined) {
        console.info('Inicializando mapa de jugadores');
        players = initializePlayersMap();
        console.info(players);
    } else {
        json = localStorage.getItem('savedPlayers');
        console.debug('Recovering JSON = ' + json);
        players = jsonToMap(json);                     // Deserialización de JSON a objeto
        console.debug('Recovering map from previous page: ');
        console.debug(players);
    }

    var timelines = $('ng-transclude').children();
    timelines.each(function (index) {
        category = $(timelines[index]).first().text().replace(/\n/g, "");

        // Inicialización de variables
        vendedorDesde = 0;
        vendedorHasta = 0;
        vendedor = "";
        compradorDesde = 0;
        compradorHasta = 0;
        comprador = "";
        precioDesde = 0;
        precioHasta = 0;

        if (category.indexOf("Vendido por") > -1) {
            vendedorDesde = category.indexOf("Vendido por ") + 12;
            category = category.substr(vendedorDesde);           // Quita el "Vendido por "
            vendedorHasta = category.indexOf(" a ");             // Hasta el " a "
            vendedor = category.substr(0, vendedorHasta).trim();

            compradorDesde = vendedorHasta + 3;
            category = category.substr(compradorDesde);          // Quita el "<vendedor> a "
            compradorHasta = category.indexOf(" por ");          // Hasta el " por "
            comprador = category.substr(0, compradorHasta).trim();

            precioDesde = compradorHasta + 5;                
            category = category.substr(precioDesde);             // Quita el "<comprador> por "
            precioHasta = category.indexOf(" €.");               // Hasta el " €."
            precio = category.substr(0, precioHasta).trim();
            precio = parseInt(precio.split(".").join(""));       // Elimina los '.' del precio y transforma en entero

            if (players.has(vendedor)) {
                saldo = players.get(vendedor);
                players.set(vendedor, saldo + precio);
            }
            if (players.has(comprador)) {
                saldo = players.get(comprador);
                players.set(comprador, saldo - precio);
            }

        } else if (category.indexOf("Cambia por") > -1) {
            precioDesde = category.indexOf("Cambia por ") + 11;
            category = category.substr(precioDesde);             // Quita el "Cambia por "
            precioHasta = category.indexOf(" €");                // Hasta el " €"
            precio = category.substr(0, precioHasta).trim();
            precio = parseInt(precio.split(".").join(""));       // Elimina los '.' del precio y transforma en entero

            // Venta de un futbolista entre 2 jugadores
            if (category.indexOf(" de ") > -1) {
                vendedorDesde = category.indexOf(" de ") + 4;
                category = category.substr(vendedorDesde);       // Quita el " de "
                vendedorHasta = category.indexOf(" a ");         // Hasta el " a "
                vendedor = category.substr(0, vendedorHasta).trim();

                compradorDesde = vendedorHasta + 3;
                category = category.substr(compradorDesde);      // Quita el " a "
                compradorHasta = category.indexOf(".");          // Hasta el "."
                comprador = category.substr(0, compradorHasta).trim();

                if (players.has(vendedor)) {
                    saldo = players.get(vendedor);
                    players.set(vendedor, saldo + precio);
                }

            // Compra de un futbolista por parte de un jugador a la máquina
            } else {
                compradorDesde = precioHasta + 5;
                category = category.substr(compradorDesde);      // Quita el "<precio> € a "
                compradorHasta = category.indexOf(".");          // Hasta el "."
                comprador = category.substr(0, compradorHasta).trim();
            }

            if (players.has(comprador)) {
                saldo = players.get(comprador);
                players.set(comprador, saldo - precio);
            }
        }
    })

    json = mapToJson(players);
    localStorage.setItem('savedPlayers', json);           // Serialización de objeto a JSON y almacenado
    //localStorage.removeItem('savedPlayers');
    return finCalculo();
}