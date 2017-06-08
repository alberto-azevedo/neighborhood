// map code, several function from udacity googleapis course and
// googleapis doc
var map;
var geocoder = null;
var fmtAddress = {}; // formated adrresses from geo api.
var artWiki = {}; // articles wikipedia about the type of place
var largeInfowindow;
var defaultIcon;
var highlightedIcon;
var myView;

function googleError() {
    initApp();
    myView.mapLoaded(false);
};

function initMap() {

    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: -8.0476749,
            lng: -34.908562200000006
        },
        zoom: 18
    });
    if (typeof(map) == 'undefined') {
        googleError();
    };
    largeInfowindow = new google.maps.InfoWindow();
    defaultIcon = makeMarkerIcon('0091ff');
    highlightedIcon = makeMarkerIcon('FFFF24');

    initApp();

    myView.mapLoaded(true);

    setTimeout(updWikiArticles, 150); // start update wiki articles
    setTimeout(initmarkers, 80); // start makers
    setTimeout(updAdress, 350); // start update adresses
};

var markers = [];

function initmarkers() {
    myView.placeList().forEach(function(place) {
        // Get the position from the location array.
        var position = {
            lat: place.loc().lat,
            lng: place.loc().lng
        };
        var title = place.name();
        // Create a marker per location, and put into markers array.
        var marker = new google.maps.Marker({
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            icon: defaultIcon,
            id: place.id()
        });
        marker.setMap(map);
        // Push the marker to our array of markers.
        markers.push(marker);
        // Create an onclick event to open the large infowindow at each marker.
        marker.addListener('click', function() {
            hndMarkerClicked(marker, place);
        });


        // Two event listeners - one for mouseover, one for mouseout,
        // to change the colors back and forth.
        marker.addListener('mouseover', function() {
            this.setIcon(highlightedIcon);
            myView.select(this.title);
        });
        marker.addListener('mouseout', function() {
            this.setIcon(defaultIcon);
            myView.unselect(this.title);
        });
    });
}

function initApp() {
    myView = new ViewModel();
    //  select item list
    myView.select = function(name) {
        myView.placeList().forEach(function(place) {
            if (place.name() === name) {
                if (place.selected) {
                    place.selected(true);
                    markerSetIconById(place.id(), highlightedIcon);
                };
            } else {
                place.selected(false);
                markerSetIconById(place.id(), defaultIcon);
            };
        });
    };

    // unselect all itens
    myView.unselect = function() {
        myView.placeList().forEach(function(place) {
            place.selected(false);
            markerSetIconById(place.id(), defaultIcon);
        });
    };

    ko.applyBindings(myView);

    //menu on for wide screen
    if ($(window).width() >= 800) {
      myView.toggleMenu();
    };
};

// reacts when maker clicked
function hndMarkerClicked(marker, place) {
    animate(marker);
    populateInfoWindow(marker, largeInfowindow, place);
};

// animate marker for 2 secs
function animate(marker) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    var self = marker;
    setTimeout(function() {
        self.setAnimation(null);
    }, 2000);
};

function populateInfoWindow(marker, infowindow, place) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        var position = {
            lat: place.loc().lat,
            lng: place.loc().lng
        };
        if (!fmtAddress[place.id()]) {
          geocodeAddress(position, place);
        };
        var infoCont = '<div>' + marker.title + '<br>' + fmtAddress[place.id()] + '</br></div><hr>';
        var articleWiki = (typeof(artWiki[place.type()]) != 'undefined') ? artWiki[place.type()] : '<em>Não foi possível acessar a Wikipédia<em>';
        infoCont += articleWiki;
        infowindow.setContent(infoCont);
        infowindow.open(map, marker);
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
        });
    };
};

function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
};

function listItemClicked(id) {
    markers.forEach(function(marker) {
        if (marker.id == id) {
            myView.setPlaceById(id);
            hndMarkerClicked(marker, myView.currentPlace());
        };
    });
};

function markerSetIconById(id, icon) {
    markers.forEach(function(marker) {
        if (marker.id == id) {
            marker.setIcon(icon);
        };
    });
};

//
function setMarker(id, visible) {
    markers.forEach(function(marker) {
        if (marker.id == id) {
            if (visible) {
                marker.setMap(map);
            } else {
                marker.setMap(null);
            };
        };
    });
};

var lastAddrUpd = 0;

function updAdress() {
    for (var indx = 0; indx < myView.placeList().length; indx++) {
        var place = myView.placeList()[indx];
        if (lastAddrUpd == indx) {
            lastAddrUpd++;
            var position = {
                lat: place.loc().lat,
                lng: place.loc().lng
            };
            var geoPlace = place;
            geocodeAddress(position, geoPlace);
            setTimeout(updAdress, 250); //recursive, kind of
            break; // wait next cycle, avoid google APIs errors for too many of calls.
        };
    };
}

function geocodeAddress(position, place) {
    geocoder = geocoder == null ? new google.maps.Geocoder() : geocoder;
    if (fmtAddress[place.id()]) { // fecthed? nothing to do
        return;
    };
    var location = new google.maps.LatLng({
        lat: position.lat,
        lng: position.lng
    });
    geocoder.geocode({
        'location': location
    }, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            myView.setAddress(results[0].place_id, results[0].formatted_address);
            fmtAddress[results[0].place_id] = results[0].formatted_address;
        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        };
    });
};

// wikipedia api call ,mainly from udacity ajax course.
function getWikiArticle(type) {
    var wikiUrl = 'https://pt.wikipedia.org/w/api.php?action=opensearch&search=' + type;
    wikiUrl += '&format=json&callback=wikiCallBack';
    $.ajax({
        url: wikiUrl,
        dataType: 'jsonp',
        context: document.body,
        timeout: 1000
    }).done(function(data) {
        var articleList = data[1];
        artWiki[type] = '<div class="wikipedia-container">';
        artWiki[type] += '<h3>Artigos Wikipedia Relevantes sobre ' + type + '</h3>';
        articleList.forEach(function(article) {
            var url = 'https://pt.wikipedia.org/wiki/' + article;
            artWiki[type] += '<li><a href="' + url + '">' +
                article + '</a></li>';
        });
        artWiki[type] += '</div>';
    }).fail(function( jqXHR, textStatus,e) {
        console.log('media wiki api error code:' + jqXHR.status);
    });
};

var lastWikiUpd = 0;

function updWikiArticles() {
    for (var indx = 0; indx < myView.placeList().length; indx++) {
        var place = myView.placeList()[indx];
        if (lastWikiUpd == indx) {
            lastWikiUpd++;
            getWikiArticle(place.type());
            setTimeout(updWikiArticles, 350); //recursive, kind of
            break; // wait next cycle, avoid google APIs errors for too many of calls.
        };
    };
};
