<?php
/**
 * Date: 30.06.2016
 * Time: 20:49
 */
require_once __DIR__ . DIRECTORY_SEPARATOR .'defines.php';

function removeFile()
{

    $params = array();
    $content = file_get_contents("php://input");
    if (!empty($content))
    {
        $params = json_decode($content, true);
    }

    if (!array_key_exists('url', $params))
    {
        $data = array(
            "success" => false,
            "message" => "There was an error deleting the file! Invalid file path!"
        );
        return json_encode($data);
    }

    if(strpos($params['url'], '..') !== false){
        $data = array(
            "success" => false,
            "data" => [],
            "message" => 'Access denied!'
        );
        return json_encode($data);
    }// if

    $file_name = IMAGES_PATH.str_replace(JS_PATH, '', $params['url']);

    if (!file_exists($file_name))
    {
         $data = array(
            "success" => false,
            "message" => "File " . $params['id'] . " doesn`t exists!"
        );
        return json_encode($data);

    }
    //
    unlink($file_name);

    $data = array(
        "success" => true,
        "message" => 'File was deleted.',
        "data" => $params
    );

    return json_encode($data);
}

echo removeFile();