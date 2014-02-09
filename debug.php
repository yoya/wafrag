<?php

function displayDir($dirname) {
    if (strpos($dirname, '..') !== false) {
        $dirname = '.';
    }
    $d = opendir($dirname);
    echo "<table border=\"1\">\n";
    $dirs = array();
    while ($e = readdir($d)) {
        $dirs []= $e;
    }
    closedir($d);
    sort($dirs);
    foreach ($dirs as $e) {
        if (strncmp($e, '.', 1) === 0) {
            continue; // skip
        }
        $f = $dirname.'/'.$e;
        if (is_dir($f)) {
            echo "<tr><td> ";
            echo "<a href=\"debug.php?$f\">$f</a>" ;
            echo "</td></tr>\n";
        } elseif (stripos($e, '.mid') !== false) {
            echo "<tr><td> ";
            echo "<a href=\"debug.html?$f\">$f</a>" ;
            echo "</td></tr>\n";
        } else {
           ; // nothing
        }
    }
    echo "</table>\n";
}


$query = $_SERVER{'QUERY_STRING'};

if (strlen($query) > 0) {
    displayDir($query);
} else {
    displayDir('midi');
}
