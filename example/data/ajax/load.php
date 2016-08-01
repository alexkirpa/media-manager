<?php
/**
 * Date: 30.06.2016
 * Time: 20:24
 */
require_once __DIR__ . DIRECTORY_SEPARATOR .'defines.php';

function loadImages()
{
    $folder = $_GET['path'];

    if(strpos($folder, '..') !== false){
        $data = array(
            "success" => false,
            "data" => [],
            "message" => 'Access denied!'
        );
        return json_encode($data);
    }// if

    $dir = IMAGES_PATH.DS.$folder.DS;


    if (!file_exists($dir))
    {
        $data = array(
            "success" => false,
            "message" => 'Folder "'.$folder.'" doesn`t exists!'
        );
        return json_encode($data);
    }
    
    $images = array();
    $d = dir($dir);
    while($name = $d->read()){
        if(!preg_match('/\.(jpg|jpeg|png)$/', $name)) continue;
        $size = filesize($dir.$name);
        $lastmod = filemtime($dir.$name);
        $images[] = array(
            'name'=>$name,
            'size'=>$size,
            'lastmod'=>$lastmod,
            'url'=>JS_PATH.DS.$folder.DS.$name
        );
    }
    $d->close();
    $data = array(
        "success" => true,
        "data" => $images
    );
    return json_encode($data);

}// fn

echo loadImages();