<?php
/**
 * Date: 29.06.2016
 * Time: 21:56
 */
require_once __DIR__ . DIRECTORY_SEPARATOR .'defines.php';

function deleteFolder()
{
    $params = array();
    $content = file_get_contents("php://input");
    if (!empty($content))
    {
        $params = json_decode($content, true); //
    }

    if (!array_key_exists('id', $params))
    {
        $data = array(
            "success" => false,
            "message" => "There was an error deleting the folder! Invalid file path!"
        );
        return json_encode($data);
    }

    if(strpos($params['id'], '..') !== false){
        $data = array(
            "success" => false,
            "data" => [],
            "message" => 'Access denied!'
        );
        return json_encode($data);
    }// if

    $dir_name = IMAGES_PATH. DS .$params['id'];

    if (!file_exists($dir_name))
    {
        $data = array(
            "success" => false,
            "message" => "Folder ".$params['id']." doesn`t exists!"
        );
        return json_encode($data);

    }

    rmdir($dir_name);

    $data = array(
        "success" => true,
        "message" => 'Folder was deleted.',
        "data" => $params
    );

    return json_encode($data);
}

echo deleteFolder();