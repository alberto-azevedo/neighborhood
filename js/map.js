// map code, several function from udacity googleapis course and
// googleapis doc
var map;
var geocoder = null;
var fmtAddress = {}; // formated adrresses from geo api.
var artWiki = {}; // articles wikipedia about the city
var largeInfowindow;
var defaultIcon;
var highlightedIcon;

function initMap() {

    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: -8.0476749,
            lng: -34.908562200000006
        },
        zoom: 18
    });
	largeInfowindow = new google.maps.InfoWindow();
	defaultIcon = makeMarkerIcon('0091ff');
	highlightedIcon = makeMarkerIcon('FFFF24');
	setTimeout(initmarkers, 50); // start makers
    setTimeout(updAdress, 200); // start update adresses

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
			populateInfoWindow(this, largeInfowindow, place);
		});

		// Two event listeners - one for mouseover, one for mouseout,
		// to change the colors back and forth.
		marker.addListener('mouseover', function() {
			this.setIcon(highlightedIcon);
			myView.togleSelected(this.title);
		});
		marker.addListener('mouseout', function() {
			this.setIcon(defaultIcon);
			myView.togleSelected(this.title);
		});
	});
}

function populateInfoWindow(marker, infowindow, place) {
	// Check to make sure the infowindow is not already opened on this marker.
	if (infowindow.marker != marker) {
		infowindow.marker = marker;
		var position = {
			lat: place.loc().lat,
			lng: place.loc().lng
		};
		geocodeAddress(position, place);
		var infoCont = '<div>' + marker.title + '<br>' + fmtAddress[place.id()] + '</br></div><hr>';
		infoCont += artWiki['Recife'];
		infowindow.setContent(infoCont);
		infowindow.open(map, marker);
		// Make sure the marker property is cleared if the infowindow is closed.
		infowindow.addListener('closeclick', function() {
			infowindow.marker = null;
		});
	}
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

function mouseEvent(type, id) {
	if (type == 'mouseover') {
		markerSetIconById(id, highlightedIcon);
	} else { // mouseout
		markerSetIconById(id, defaultIcon);
	}

};

function markerSetIconById(id, icon) {
	markers.forEach(function(marker) {
		if (marker.id == id) {
			marker.setIcon(icon);
		}
	});
};

function listItemClicked(id) {
	markers.forEach(function(marker) {
		if (marker.id == id) {
			myView.setPlaceById(id);
			populateInfoWindow(marker, largeInfowindow, myView.currentPlace());
		}
	});
};

// the jQuery events below syncronizes map and list itens iteration.
$('[listItem*="listItem"]').mouseover(function() {
		mouseEvent("mouseover", $(this).attr("class"));
	})
	.mouseout(function() {
		mouseEvent("mouseout", $(this).attr("class"));
	}).click(function() {
		listItemClicked($(this).attr("class"));
	});

$('#addressFilter').keyup(function() {
	var data = $(this).val();
	markers.forEach(function(marker) {
		if (marker.title.toLowerCase().indexOf(data.toLowerCase()) !== -1) {
			marker.setMap(map);
		} else {
			marker.setMap(null);
		};
	});
});


var lastPlaceUpd = 0;

function updAdress() {
	// note: used for in because break statment, for in has no break.
	for (var indx in myView.placeList()) {
		var place = myView.placeList()[indx];
		if (lastPlaceUpd == indx) {
			lastPlaceUpd++;
			var position = {
				lat: place.loc().lat,
				lng: place.loc().lng
			};
			var geoPlace = place;
			geocodeAddress(position, geoPlace);
			setTimeout(updAdress, 250); //recursive, kind of
			break; // wait next cycle, avoid google APIs errors for too many of calls.
		}
	};
}

function geocodeAddress(position, place) {
	geocoder = geocoder == null ? new google.maps.Geocoder():geocoder;
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
			//fmtAddress[results[0].place_id] = 'ERROR GEOCODING...';
		}
	});
};

// wikipedia api call ,mainly from udacity ajax course.
var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + 'Recife';
wikiUrl += '&format=json&callback=wikiCallBack';
var wikiRequestTimeout = setTimeout(function() {
console.log("failed to get wikipedia resources");
}, 8000);

$.ajax({
url: wikiUrl,
dataType: "jsonp",
context: document.body,
success: function(data) {
  //console.log("success:" + data);
  var articleList = data[1];
  artWiki['Recife'] = '<div class="wikipedia-container">';
  artWiki['Recife'] += '<h3>Links Relevantes sobre o Recife</h3>';
  articleList.forEach(function (article) {
	var url = 'https://en.wikipedia.org/wiki/' + article;
	artWiki['Recife'] += '<li><a href="' + url + '">' +
		article + '</a></li>';
	clearTimeout(wikiRequestTimeout);
  });
  artWiki['Recife'] += '</div>';
}
}).done(function(data) {
//console.log(data);
}).fail(function(e) {
console.log("error:" + e);
alert( "error:" + e );
});
