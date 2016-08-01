<?php
/**
 * Date: 29.06.2016
 * Time: 21:06
 */
require_once __DIR__ . DIRECTORY_SEPARATOR .'defines.php';

function newFolder ()
{
    $params = array();
    $content = file_get_contents("php://input");

    if (!empty($content))
    {
        $params = json_decode($content, true);
    }

    if (!array_key_exists('parentId', $params) || !array_key_exists('text', $params))
    {
        $data = array(
            "success" => false,
            "message" => "There was an error creating the folder! Invalid file path!"
        );
        return json_encode($data);
    }

    if(strpos($params['text'], '..') !== false || strpos($params['parentId'], '..') !== false){
        $data = array(
            "success" => false,
            "data" => [],
            "message" => 'Access denied!'
        );
        return json_encode($data);
    }// if

    $dir_name = IMAGES_PATH .DS. $params['parentId'].DS. $params['text'];

    if (file_exists($dir_name))
    {
        $data = array(
            "success" => false,
            "message" => "Folder ". $params['parentId'] .DS. $params['text']." already exists!"
        );
        return json_encode($data);
    }

    mkdir($dir_name, 0755);

    $params['id'] = $params['parentId'] . DS . $params['text'];

    $data = array(
        "success" => true,
        "message" => 'Folder was created.',
        "data" => $params
    );

    return json_encode($data);
}

echo newFolder();