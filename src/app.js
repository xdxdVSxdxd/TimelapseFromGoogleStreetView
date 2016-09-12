$( document ).ready(function() {
 
  // do your standard jQuery stuff here
 
});


// write here the size of the images you wish to receive from Street View
var imageWidth = 640;
var imageHeight = 480;

// the Field of Vision for the images, goes from 20 (narrow) to 120 (wide)
var fov = 120;

// do you want to look up (90), straight (0) or down (-90)? (it indicates the up and down angle of the camera) 
var pitch = 0;


// we will store our paths here
// the polylines in Google Maps' Directions service
var paths = new Array();

// this will contain the instance of the Directions service
var directionsService;

// the Map
var map;

// some timers for animations and getting paths
var timeranimate = null;

// a variable in which we will store the distance along a path
var distance;

// how many segments from our paths we want to travel each step?
var deltadistance = 1;

// we will store the lines we draw on the map here, so that we can update them 
var currentLines = null;

// we use this to keep track of the images, numbering them sequentially
var imagenum = 0;

function initMap() {

	map = new google.maps.Map(document.getElementById('viz'), {
	  center: {lat: 41.9, lng: 12.5},  // this is Rome! :)
	  zoom: 11,
	  disableDefaultUI: true,
	  zoomControl: false,
	  mapTypeControl: false,
	  scaleControl: false,
	  streetViewControl: false,
	  rotateControl: false,
	  fullscreenControl: false
	});
    
  	// get the instance of the Directions service
	directionsService  = new google.maps.DirectionsService();


  // just for testing, we will generate directions to go
  // from random points on the map, generating them
  // so that they fall within min/max latitude and longitude
  // (around Rome)

	minlat = 41.8;
	maxlat = 42;

	minlng = 12.4;
	maxlng = 12.6;


	generatePaths();

}

function generatePaths(){

  // let's generate a random start and end point
  // (hoping that there are streets nearby, so that
  // Google Maps can snap to them, to generate the directions
  
	var startLat = randomFromInterval(minlat,maxlat);
	var startLng = randomFromInterval(minlng,maxlng);

	var endLat = randomFromInterval(minlat,maxlat);
	var endLng = randomFromInterval(minlng,maxlng);


	// prepare the request for Google Directions service
	var request = {
		origin: new google.maps.LatLng(startLat, startLng),
		destination: new google.maps.LatLng(endLat, endLng),
		travelMode: 'DRIVING'
	};

	// invoke the service
	directionsService.route(request, function(result, status) {
		if (status == 'OK') {
			
			// create an object to keep track of the
			// path we just generated
			var o = new Object();


			// create a Polyline, to hold the line of the path
			var polyline = new google.maps.Polyline({
			  path: [],
			  strokeColor: '#FF0000',
			  strokeWeight: 1
			});
			
			// reset distance
			var distance = 0;
			
			// these are the legs of the path, we take the first returned path here
			// a better version could take all the the optional paths suggested by Google Maps
			var legs = result.routes[0].legs;
			
			// let's use the results to create the segments of the Polyline
			for (i=0;i<legs.length;i++) {
				
				// the leg is composed of steps
			  	var steps = legs[i].steps;
			  	
			  	// let's update the distance
			  	distance = distance + legs[i].distance.value;
			  
			  	for (j=0;j<steps.length;j++) {
			    
			    		// this is the next step of the path
			    		var nextSegment = steps[j].path;
			    		
			    		// get all the pieces
			    		for (k=0;k<nextSegment.length;k++) {
			      			polyline.getPath().push(nextSegment[k]);
			    		}
			  	}
			}

			// we can show the Polyline on the map
			polyline.setMap(map);


			// but most important, let's store it in our object
			// to save it for later, to animate it
			o.poly = polyline;
			
			// this is the total distance of the path
			o.distance = distance;
			
			// this is the distance we currently travelled in the animation
			// it is initialized with 0, to start from the beginning
			o.currentDistance = 0;

			// let's put the path with the others
			paths.push( o );

				// start animation and generating StreetView images
				if(timeranimate!=null){
					clearInterval( timeranimate  );
				}
				timeranimate = setInterval(animate,2000);	// every 2 seconds


		}
	});

}


function animate(){

	// check if we are already drawing some lines for the animations
	if(currentLines!=null){
		
		// if we are, take them temporarily off the map
		for(var i = 0; i<currentLines.length; i++){
			currentLines[i].setMap(null);
		}
		
	}
	
	// initialize a new frame for the lines on the map
	currentLines = new Array();

	// take all the paths we generated this far
	for(var i = 0; i<paths.length; i++){
		
		// update the current distance for each path, so we know if we finished it
		paths[i].currentDistance = paths[i].currentDistance+deltadistance;
		
		// if we finished it: start over (or else we could have taken it off the array)
		if(paths[i].currentDistance >= paths[i].poly.getPath().getLength()){
			paths[i].currentDistance = 0;
		}
		
		// take the points on the path which sit at the current distance and the one at the currentdistance + deltadistance, the next point
		var p1 = paths[i].poly.getPath().getAt( paths[i].currentDistance );
		var p2 = paths[i].poly.getPath().getAt(    Math.min( paths[i].distance, (paths[i].currentDistance+deltadistance) )    );

		// create a line for the current piece of the path
		var line = new google.maps.Polyline({
		    path: [
		    	{lat: p1.lat(), lng: p1.lng()},
    			{lat: p2.lat(), lng: p2.lng()}
		    ],
		    geodesic: true,
		    strokeColor: '#00FF00',
		    strokeOpacity: 1.0,
		    strokeWeight: 4
		  });

		// set it on the map
		line.setMap(map);
		
		// add it to the others
		currentLines.push( line );


		// let's calculate the heading/bearing from P1 to P2
		var L2 = p2.lng();
		var L1 = p1.lng();
		var F1 = p1.lat();
		var F2 = p2.lat();
		var y = Math.sin(L2-L1) * Math.cos(F2);
    	var x = Math.cos(F1)*Math.sin(F2) - Math.sin(F1)*Math.cos(F2)*Math.cos(L2-L1);
    	var brng = Math.atan2(y, x) * 180 / Math.PI + 180;
    	var heading = -brng; //(brng+360) % 360;

		//use the points to get image from StreetView
		var url =  "https://maps.googleapis.com/maps/api/streetview?size=" + imageWidth + "x" + imageHeight + "&location=" + p1.lat() + "," + p1.lng() + "&fov=" +  fov + "&heading=" + heading + "&pitch=" + pitch + "&key=YOUR_GOOGLE_STREETVIEW_API_KEY_HERE";

		//$("#image img").attr("src",url);

		// send the URL to a PHP file for saving
		// watch out! You are doubling your requests to the StreetView service
		// this may impact on your usage limits (e.g.: you may need to pay)
		// For this, you may want to comment out the line above to only do
		// 1 query for frame, so that you cut the requests in half
		$.post("saveImage.php",
			{
				"url": url,
				"i": imagenum
			}, function(){
				// do something
			}
		);

		imagenum++;
	}

}


// UTILITY METHODS

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

function randomFromInterval(min,max)
{
    return Math.random()*(max-min)+min;
}
