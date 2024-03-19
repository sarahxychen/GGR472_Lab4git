/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2FyYWh4eWNoZW4iLCJhIjoiY2xyZnB4c2h0MDhnMzJqcGpvZ2sxOHk4byJ9.yIz3cOJ6CJBeoUb3hvbBFA'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/sarahxychen/clskmpfs603tf01p25v25bs4j',  
    center: [-79.39, 43.65],  // starting point, longitude/latitude
    zoom: 12 // starting zoom level
});

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());

/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
//HINT: Create an empty variable
//      Use the fetch method to access the GeoJSON from your online repository
//      Convert the response to JSON format and then store the response in your new variable

let colgeojson;

// Fetch GeoJSON from URL and store response as JSON
fetch('https://raw.githubusercontent.com/sarahxychen/GGR472_Lab4git/main/data/pedcyc_collision_06-21.geojson') //UPDATE THIS AFTER PUBLISHING
    .then(response => response.json())
    .then(response => {
        console.log(response); //Check response in console
        colgeojson = response; // Store geojson as variable using URL from fetch response
    });

//View and style source data as geojson 
map.on('load', () => {
    map.addSource('pedbike_collision', {
        type: 'geojson',
        data: colgeojson
    });
    
    map.addLayer({
        'id': 'collision_pts',
        'type': 'circle',
        'source': 'pedbike_collision',
        'paint': {
            'circle-radius': 4,
            'circle-color': '#010c1c'
        }
    });
    
});


//map load event handler and create bounding box envelope
map.on('load', () => {
    let bbox = turf.envelope(colgeojson);
    let bboxscaled = turf.transformScale(bbox, 1.50);

    // put the resulting envelope in a geojson format FeatureCollection
    bboxgeojson = {
        "type": "FeatureCollection",
        "features": [bboxscaled]
    };
    
    //Create turf hexgrid using coordinates from bounding box array 
    let bboxcoords= [-79.621974,43.590289,-79.122974,43.837935]
         // bboxcoords = [min x, min y, max x, max y] -> find using console.log(bboxgeojson) in console log
    let hexgeojson = turf.hexGrid(bboxcoords, 0.6, { units: 'kilometers' }) //increase hex cell to improve pattern visbility for crash counts


    //Step 4: AGGREGATE COLLISIONS BY HEXGRID
    //Turf collect function -> collect properties form the point layer by hex polygons
    let collishex= turf.collect(hexgeojson, colgeojson, '_id', 'values'); 

    //count # of features inside each hexagon, and identify maximum value 
    let maxcollis = 0;

    collishex.features.forEach((feature) => {
        feature.properties.COUNT = feature.properties.values.length
        if (feature.properties.COUNT > maxcollis) {
         console.log(feature);
         maxcollis = feature.properties.COUNT
      }
    });

// Step 5: FINALIZE YOUR WEB MAP
//Link hex density to button and display on map:
// document.getElementById('bbox').addEventListener('click', () => {

    // stylize data after adding onto map 
    map.addSource('collis-hex', {
        type: 'geojson',
        data: hexgeojson  // use hexgrid as source
    });

    map.addLayer({
        'id': "collis-hex-fill",
        'type': "fill",
        'source': "collis-hex",
        'paint': {
            'fill-color': [
                'step', //style data output
                ['get','COUNT'],
                '#a9c9f5', //count 0-4 density
                5, '#7faef0', //count 5-9 density
                10, '#608dcc', //count 10-19 density
                20, '#3b66a3', //count 20-29 density
                30, '#27508a', // count 30-39 density
                40, '#163e75', // count 40-71
                72, '#042757', //max count: 72
            ],
            'fill-opacity': 0.8,
            'fill-outline-color': "white"
        }
    });

    // document.getElementById('bbox').disabled = true; // disable button after click
    // }); 

    //Add toggle feature for 2 layers

    //Change collision point layer display based on check box using setLayoutProperty method
    document.getElementById('collis_pts').addEventListener('change', (e) => {
        map.setLayoutProperty(
            'collision_pts',
            'visibility',
             e.target.checked ? 'visible' : 'none'
         );
    });

    //Change collision density layer display based on check box using setLayoutProperty method
    document.getElementById('bbox').addEventListener('change', (e) => {
        map.setLayoutProperty(
         'collis-hex-fill',
         'visibility',
          e.target.checked ? 'visible' : 'none'
        );
    });

    //add popup feature
    map.on('click', 'collis-hex-fill',(e) => {
        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML("<b>Collision count:</b>" + e.features[0].properties.COUNT)
            .addTo(map);
    })

});



/*--------------------------------------------------------------------
    Step 3: CREATE BOUNDING BOX AND HEXGRID
--------------------------------------------------------------------*/
//HINT: All code to create and view the hexgrid will go inside a map load event handler
//      First create a bounding box around the collision point data then store as a feature collection variable
//      Access and store the bounding box coordinates as an array variable
//      Use bounding box coordinates as argument in the turf hexgrid function

// //Link boundring box to button:
// document.getElementById('bbox').addEventListener('click', () => {
//     // add the bounding box to the map to view
//     map.addSource('collis-bbox', {
//         "type": "geojson",
//         "data": bboxgeojson  // use bbox geojson bounding box as source
//     });

//     map.addLayer({
//         "id": "collisEnvelope",
//         "type": "fill",
//         "source": "collis-bbox",
//         "paint": {
//             'fill-color': "blue",
//             'fill-opacity': 0.5,
//             'fill-outline-color': "black"
//         }
//     });

//     document.getElementById('bbox').disabled = true; // disable button after click
// }); 

//Create turf hexgrid using coordinates from bounding box array 
// bboxcoords = [min x, min y, max x, max y] -> find using console.log(bboxgeojson) in console log
// let bboxcoords = [bboxgeojson.geometry.coordinates[0][0][0], // min x coordinates
//                  bboxgeojson.geometry.coordinates[0][0][1], // min y coordinates
//                  bboxgeojson.geometry.coordinates[0][2][0], // max x coordinates
//                  bboxgeojson.geometry.coordinates[0][2][1]]; // max y coordinates

// let bboxcoords= [-79.621974,43.590289,-79.122974,43.837935]
// let hexgeojson = turf.hexGrid(bboxcoords, 0.5, { units: 'kilometers' });

// //Link hex boundring box to button:

// document.getElementById('bbox').addEventListener('click', () => {

//     // add the bounding box to the map to view
//     map.addSource('collis-bbox', {
//         "type": "geojson",
//         "data": hexgeojson  // use bbox geojson bounding box as source
//     });

//     map.addLayer({
//         "id": "collisEnvelope",
//         "type": "fill",
//         "source": "collis-bbox",
//         "paint": {
//             'fill-color': "blue",
//             'fill-opacity': 0.5,
//             'fill-outline-color': "black"
//         }
//     });

//     document.getElementById('bbox').disabled = true; // disable button after click
// }); 

/*--------------------------------------------------------------------
Step 4: AGGREGATE COLLISIONS BY HEXGRID
--------------------------------------------------------------------*/
//HINT: Use Turf collect function to collect all '_id' properties from the collision points data for each heaxagon
//      View the collect output in the console. Where there are no intersecting points in polygons, arrays will be empty

//Turf collect function -> collect properties form the point layer by hex polygons
// let collishex= turf.collect(hexgeojson,colgeojson,'_id','values'); 

// //count # of features inside each hexagon, and identify maximum value 
// let maxcollis = 0;

// collishex.features.forEach((feature) => {
//     feature.properties.COUNT = feature.properties.values.length
//     if (feature.properties.COUNT > maxcollis) {
//         console.log(feature);
//         maxcollis = feature.properties.COUNT
//     }
// });

// //Link hex boundring box to button:

// document.getElementById('bbox').addEventListener('click', () => {

//     // add the bounding box to the map to view
//     map.addSource('collis-bbox', {
//         "type": "geojson",
//         "data": hexgeojson  // use bbox geojson bounding box as source
//     });

//     map.addLayer({
//         "id": "collisEnvelope",
//         "type": "fill",
//         "source": "collis-bbox",
//         "paint": {
//             'fill-color': [
//                 'step', //style data output
//                 ['get','COUNT'],
//                 '#800026',
//                 10, 'bd0026',
//                 25, 'e31a1c'
//             ],
//             'fill-opacity': 0.5,
//             'fill-outline-color': "white"
//         }
//     });

//     document.getElementById('bbox').disabled = true; // disable button after click
// }); 

// document.getElementById('bboxdensity').addEventListener('click', () => {

//     // add the bounding box to the map to view
//     map.addSource('collis-hex', {
//         "type": "geojson",
//         "data": hexgeojson  // use bbox geojson bounding box as source
//     });

//     map.addLayer({
//         "id": "collis-hex-fill",
//         "type": "fill",
//         "source": "collis-hex",
//         "paint": {
//             'fill-color': [
//                 'step', //style data output
//                 ['get','COUNT'],
//                 '#800026',
//                 10, 'bd0026',
//                 25, 'e31a1c'
//             ],
//             'fill-opacity': 0.5,
//             'fill-outline-color': "white"
//         }
//     });

//     document.getElementById('bboxdensity').disabled = true; // disable button after click
// }); 

//add and display data on map

// /*--------------------------------------------------------------------
// Step 5: FINALIZE YOUR WEB MAP
// --------------------------------------------------------------------*/
//HINT: Think about the display of your data and usability of your web map.
//      Update the addlayer paint properties for your hexgrid using:
//        - an expression
//        - The COUNT attribute
//        - The maximum number of collisions found in a hexagon
//      Add a legend and additional functionality including pop-up windows

















