<?php
/**
 * Date: 28.06.2016
 * Time: 20:40
 */

require_once __DIR__ . DIRECTORY_SEPARATOR .'defines.php';

function readFolders() {

    $node = $_GET['node'];

    if(strpos($node, '..') !== false){
        $data = array(
            "success" => false,
            "data" => [],
            "message" => 'Access denied!'
        );
        return json_encode($data);
    }

    $nodes = array();
    $directory = IMAGES_PATH. DS .$node;

    if (!file_exists($directory))
    {
        $data = array(
            "success" => false,
            "message" => 'Folder "'. $node. '" doesn`t exists!'
        );
        return json_encode($data);
    }
    if (is_dir($directory)){
        $d = dir($directory);
        while($f = $d->read()){
            if($f == '.' || $f == '..' || substr($f, 0, 1) == '.') continue;

            if(is_dir($directory.DS.$f)){
                $isLeaf = true;
                $dd = dir($directory.DS.$f);
                while (false !== ($entry = $dd->read())) {
                    if($entry !== '.' && $entry !== '..' && is_dir($directory.DS.$f.DS.$entry)) {
                        $isLeaf = false;
                        break;
                    }
                }
                $dd->close();

                $nodes[] = array(
                    'text' => $f,
                    'id'   => $node.DS.$f,
                    'leaf' => $isLeaf
                );
            }
        }
        $d->close();
    }

    $data = array(
        "success" => true,
        "data" => $nodes
    );

    return json_encode($data);
}// fn

echo readFolders();
