//app.js

var PLACES = [{
        id: 'ChIJ8S4Vhx0ZqwcRcX69oLZp5_M',
        name: 'João da Carne de Sol',
        loc: {
            lat: -8.047808999999999,
            lng: -34.906638999999984
        },
        type: 'Restaurante'
    },
    {
        id: 'ChIJMeEiHh0ZqwcRWacoUEfgLcw',
        name: 'Extrabom',
        loc: {
            lat: -8.0460257,
            lng: -34.90939679999997
        },
        type: 'Supermercado'
    },
    {
        id: 'ChIJyaa7gR0ZqwcRH-qsBx2SiTA',
        name: 'Drogasil',
        loc: {
            lat: -8.0475254,
            lng: -34.90678109999999
        },
        type: 'Farmacia'
    },
    {
        id: 'ChIJM7VxwxwZqwcRHBfjlcnAPBY',
        name: 'Drogaria São Paulo',
        loc: {
            lat: -8.045705,
            lng: -34.91013320000002
        },
        type: 'Farmacia'
    },
    {
        id: 'EkVSLiBQYWRyZSBBbmNoaWV0YSwgMjgxLTI5OSAtIE1hZGFsZW5hLCBSZWNpZmUgLSBQRSwgNTA3MTAtNDMwLCBCcmFzaWw',
        name: 'Massa Nobre',
        loc: {
            lat: -8.047288,
            lng: -34.90648049999999
        },
        type: 'Padaria'
    },
    {
        id: 'ChIJQweqyB0ZqwcRqi0NxJVE12A',
        name: 'Posto Torre',
        loc: {
            lat: -8.0486756,
            lng: -34.90861940000002
        },
        type: 'Posto de combustivel'
    }
];

var Place = function(data) {

    this.visible = ko.observable(true);
    this.id = ko.observable(data.id);
    this.name = ko.observable(data.name);
    this.loc = ko.observable(data.loc);
    this.type = ko.observable(data.type);

    this.selected = ko.observable(false);
    this.address = ko.observable('');
    this.setAddress = function(address) {
        this.address = address;
    };
}; // of Place

var ViewModel = function() {
    var self = this;

    this.placeList = ko.observableArray([]);
    this.currentPlace = ko.observable(this.placeList()[0]);
    this.addressFilter = ko.observable('');
    this.addressFilter.subscribe(function(data) {
        // filter adrress list
        if (data.length == 0) {
            self.placeList().forEach(function(place) {
                place.visible(true);
                setMarker(place.id(),true);
            });
            return;
        };
        self.placeList().forEach(function(place) {
            if (place.name().toLowerCase().indexOf(data.toLowerCase()) !== -1) {
                place.visible(true);
                setMarker(place.id(),true);
            } else {
                place.visible(false);
                setMarker(place.id(),false);
            };
        });
    });

    this.initPlaceList = function() {
        self.placeList.removeAll();
        PLACES.forEach(function(placeElm) {
            self.placeList.push(new Place(placeElm));
        });
    };

    this.setPlace = function(clickedPlace) {
        self.currentPlace(clickedPlace);
        listItemClicked(clickedPlace.id());
    };

    this.setAddress = function(id, address) {
        self.placeList().forEach(function(place) {
            if (place.id() == id) {
                place.setAddress(address);
            };
        });
    };

    this.setPlaceById = function(id) {
        self.placeList().forEach(function(place) {
            if (place.id() == id) {
                self.currentPlace(place);
            };
        });
    };

    this.detailsEnabled = ko.observable(false);

    this.initPlaceList();
};
