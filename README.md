# TimelapseFromGoogleStreetView
Generate Time Lapse Movies from Google Street View


1. load the script and its subdirectories onto a web server
2. check the source code of app.js: the code contains the configurations in the variable definitions at the top of the file
3. run the script by calling it up on your browser through the URL on your web server
4. when the animated green dash reaches the end of the path on the map, the process is over and you can stop the script (close the browser window)
5. then you will have the series of images in the "images" folder, and you just need to get them together into a video, for example using FFMPEG

for example you can use the FFMPEG command:

ffmpeg -framerate 1/5 -i image_%05d.png -c:v libx264 -r 30 -pix_fmt yuv420p out.mp4
