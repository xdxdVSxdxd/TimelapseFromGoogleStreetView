<?php

	if( isset($_REQUEST["url"]) && isset($_REQUEST["i"]) ){
		
		// if you're using PHP5, uncomment the thing below and comment all the rest within these curly brackets
		//copy(url, 'images/image_' . $_REQUEST["i"] . '.jpeg');

		//echo(  $_REQUEST["url"] );

		$content = file_get_contents($_REQUEST["url"]);

		echo( $content );

		$ii = "" . $_REQUEST["i"];

		if($_REQUEST["i"]<10) {
			$ii = "0000" . $ii; 
		} else if($_REQUEST["i"]<100) {
			$ii = "000" . $ii; 
		} else if($_REQUEST["i"]<1000) {
			$ii = "00" . $ii; 
		} else if($_REQUEST["i"]<10000) {
			$ii = "0" . $ii; 
		}

		$fp = fopen('images/image_' . $ii . '.jpeg', "w");

		fwrite($fp, $content);
		fclose($fp);

	}

?>
