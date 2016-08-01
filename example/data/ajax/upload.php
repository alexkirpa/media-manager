<?php
/**
 * Date: 30.06.2016
 * Time: 20:53
 */
require_once __DIR__ . DIRECTORY_SEPARATOR .'defines.php';

function uploadFile()
{
    $max_size = 2;

    $folder = $_POST['folder'];

    if(strpos($folder, '..') !== false){
        $data = array(
            "success" => false,
            "data" => [],
            "message" => 'Access denied!'
        );
        return json_encode($data);
    }// if

    $dir_name = IMAGES_PATH . DS . $folder;

    if (!file_exists($dir_name))
    {
        //
        $data = array(
            "success" => false,
            "message" => "Error: invalid folder path!"
        );
        return json_encode($data);
    }

    $file = $_FILES['file'];

    $fileType = returnExistFileType($file['type']);

    if ($fileType === null) {
        $data = array(
            "success" => false,
            "message" => 'Error: invalid file type!'
        );
        return json_encode($data);
    }

    if ($file['size'] > $max_size * 1048576) {

        $data = array(
            "success" => false,
            "message" => 'Error: file size is larger then '.$max_size.'Mb.'
        );
        return json_encode($data);
    }

    if (null === getFileInfo($file['name']) || $dir_name === null) {
        $data = array(
            "success" => false,
            "message" => 'Error: invalid file name!'
        );
        return json_encode($data);
    }

    $uploadPath = upload($file, $dir_name);

    if ($uploadPath !== null)
    {
        $data = array(
            "success" => true,
            "message" => 'File was uploaded.'
        );
    } else {
        $data = array(
            "success" => false,
            "message" => 'There was an error uploading the file!'
        );
    }
    return json_encode($data);
}

function upload($file, $dir_name)
{
    $pathInfo = getFileInfo($file['name']);

    $path = $pathInfo['basename'];
    $info = move($file['tmp_name'], $dir_name, $path);

    unset($file);

    if ($info !== null){
        return $dir_name . DS . $path;
    } else {
        return null;
    }
}

function getFileInfo($file)
{
    return $file !== null ? (array)pathinfo($file) : null;
}

function returnExistFileType($type)
{
    $typeArray = array(
        'img' => array(
            'image/png',
            'image/jpg',
            'image/jpeg',
        )
    );

    foreach ($typeArray as $key => $value) {
        if (in_array($type, $value)) {
            return $key;
        }
    }

    return null;
}

function move($tmpFile, $directory, $name = null)
{
    $tmp = new SplFileInfo($tmpFile);
    $target = getTargetFile($directory, $name, $tmp);
    if ($target === null){
        return null;
    }
    if (!@rename($tmp->getPathname(), $target)) {
        return null;
    }

    @chmod($target, 0666 & ~umask());

    return $target;
}

function getTargetFile($directory, $name = null, $tmp)
{
    if (!is_dir($directory)) {
        if (false === @mkdir($directory, 0777, true) && !is_dir($directory)) {
            return null;
        }
    } elseif (!is_writable($directory)) {
        return null;
    }

    $target = rtrim($directory, '/\\').DS.(null === $name ? $tmp->getBasename() : getName($name));

    return new SplFileInfo($target);
}

function getName($name)
{
    $originalName = str_replace('\\', '/', $name);
    $pos = strrpos($originalName, '/');
    $originalName = false === $pos ? $originalName : substr($originalName, $pos + 1);

    return $originalName;
}

echo uploadFile();