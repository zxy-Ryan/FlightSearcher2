"use strict";

// functions generated automatically when convert ES6 to ES5.
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var airportURL = "database/Airports.json";
var flightURL = "database/Flights.json";
var cityURL = "database/Cities.json";

// create a map to store the nodes connected to certain start node
$.ajaxSettings.async = false;
var nodeAttach = new Map();
var airportNum = new Map();
$.getJSON(airportURL, function (airports) {
    $.each(airports, function (index1, value1) {
        var attach = [];
        airportNum.set(value1.Code, index1 + 1);
        $.getJSON(flightURL, function (flights) {
            $.each(flights, function (index2, value2) {
                if (value2.StartID == index1 + 1) {
                    attach.push(airports[value2.EndID - 1].Code);
                }
            });
        });
        attach = Array.from(new Set(attach));
        nodeAttach.set(value1.Code, attach);
    });
});

// recursion helper
function Pathfinder(startcode, endcode, path, paths) {
    path.push(startcode);

    if (startcode == endcode) {
        var path2 = path.slice(0);
        paths.push(path2);
        return;
    }

    ;

    for (i in nodeAttach.get(startcode)) {
        if (!path.includes(nodeAttach.get(startcode)[i])) {
            var newstart = nodeAttach.get(startcode)[i];
            Pathfinder(newstart, endcode, path, paths);
            path.pop();
        }
    }
}

// find hall paths between two cities.
function findpath(startcode, endcode) {
    var path = [];
    var paths = [];
    Pathfinder(startcode, endcode, path, paths);
    return paths;
}

// create a Map to store all the possible flight arrangements between two cities.
function flightdict(startcode, endcode) {
    p = findpath(startcode, endcode);
    flightsMap = new Map();

    for (var i = 0; i < p.length; i++) {
        var path = p[i];
        var possibleflight = [];
        var flightcombo = [];

        for (var j = 0; j < path.length - 1; j++) {
            $.getJSON(flightURL, function (flights) {
                $.each(flights, function (index, value) {
                    if (value.StartID == airportNum.get(path[j]) && value.EndID == airportNum.get(path[j + 1])) {
                        possibleflight.push(value.Code);
                    }
                });
            });
            flightcombo.push(possibleflight);
            possibleflight = [];
        }

        flightsMap.set(path, flightcombo);
    }

    return flightsMap;
}

// cartesian product algorithm
function cartesianProduct(arr) {
    return arr.reduce(function (a, b) {
        return a.map(function (x) {
            return b.map(function (y) {
                return x.concat(y);
            });
        }).reduce(function (a, b) {
            return a.concat(b);
        }, []);
    }, [[]]);
}

// help to list all the combinations in flightdict using cartesian product
function flights_list(startcode, endcode) {
    var newdict = flightdict(startcode, endcode);
    allflights = [];
    var mapIter = newdict.keys();

    for (i = 0; i < newdict.size; i++) {
        var key = mapIter.next().value;
        flightList = cartesianProduct(newdict.get(key));
        allflights.push(flightList);
    }

    allflights = [].concat.apply([], allflights); //多为数组转化为一维数组

    return allflights;
}

// find the path with shortest time, inclusding the overlay time
function findShortestFlight(startcode, endcode) {
    var timeList = [];
    var pathTimeMap = pathtime(startcode, endcode);
    var mapIter = pathTimeMap.values();

    for (var i = 0; i < pathTimeMap.size; i++) {
        timeList.push(mapIter.next().value);
    }

    var shortestTime = Math.min.apply(null, timeList);

    var shortestPath = _toConsumableArray(pathTimeMap.entries()).filter(function (_ref) {
        var v = _ref[1];
        return v === shortestTime;
    }).map(function (_ref2) {
        var _ref3 = _slicedToArray(_ref2, 1),
            k = _ref3[0];

        return k;
    });

    return [shortestPath[0], shortestTime];
}

// calculate flight time including the overlay time of each flight
function pathtime(startcode, endcode) {
    var allflights = flights_list(startcode, endcode);
    var pathTimeMap = new Map();
    var FlightTimeMap = new Map();
    totalTimeList = [];
    $.getJSON(flightURL, function (flights) {
        $.each(flights, function (index, value) {
            var depTimeString = value.Deptime;
            var arrTimeString = value.Arrtime;

            if (depTimeString.length < 8) {
                depTimeString = '0' + depTimeString;
            }

            if (arrTimeString.length < 8) {
                arrTimeString = '0' + arrTimeString;
            }

            var depTime = new Date('2019-01-01T' + depTimeString + 'Z');
            var arrTime = new Date('2019-01-01T' + arrTimeString + 'Z');
            FlightTimeMap.set(value.Code, [depTime, arrTime]);
        });
    });

    for (var i in allflights) {
        var oneFlight = allflights[i];
        var pathTime = 0;

        for (var j in oneFlight) {
            var flightTime = 0;
            var depAndArr = FlightTimeMap.get(oneFlight[j]);
            flightTime = depAndArr[1] - depAndArr[0];
            pathTime += flightTime; // time = oneFlight[j]
        }

        pathTimeMap.set(oneFlight, pathTime);
    }

    for (var i in allflights) {
        var oneFlight = allflights[i];
        var pathOverlayTime = 0;

        for (var j = 0; j < oneFlight.length - 1; j++) {
            var overlayTime = 0;
            var thisDepAndArr = FlightTimeMap.get(oneFlight[j]);
            var thisArrTime = thisDepAndArr[1];
            var nextDepAndArr = FlightTimeMap.get(oneFlight[j + 1]);
            var nextDepTime = nextDepAndArr[0];

            if (nextDepTime > thisArrTime) {
                overlayTime = nextDepTime - thisArrTime;
            } else {
                overlayTime = nextDepTime - thisArrTime + 86400000;
            }

            pathOverlayTime += overlayTime;
        }

        timeWithoutOverlay = pathTimeMap.get(oneFlight);
        totalTimeList.push(timeWithoutOverlay + pathOverlayTime);
        pathTimeMap.set(oneFlight, timeWithoutOverlay + pathOverlayTime);
        return pathTimeMap;
    }
}

// obtain the city name by the airports' code
function getCity(airportCode) {
    var cityid = "";
    var name = "";
    $.getJSON(airportURL, function (airport) {
        $.each(airport, function (index, value) {
            if (value.Code == airportCode) {
                cityid = value.CityID;
            }
        });
    });
    $.getJSON(cityURL, function (city) {
        $.each(city, function (index, value) {
            if (index + 1 == cityid) {
                name = value.Name;
                console.log(name);
            }
        });
    });
    return name;
}