<?php

function displayDir($dirname) {
    $d = opendir($dirname);
    echo "<table border=\"1\">\n";
    while ($e = readdir($d)) {
        if (strncmp($e, '.', 1) === 0) {
            continue; // skip
        }
        $f = $dirname.'/'.$e;
        if (is_dir($f)) {
            echo "<tr><td> ";
            displayDir($f);
            echo "</td></tr>\n";
        } elseif (strpos($e, '.mid') !== false) {
            echo "<tr><td> ";
            echo "<a href=\"debug.html?$f\">$f</a>" ;
            echo "</td></tr>\n";
        } else {
           ; // nothing
        }
    }
    echo "</table>\n";
}

displayDir('.');
