#MediaManager plugin for ExtJs htmlEditor

##About
MediaManager is a plugin for the ExtJS 4 htmleditor field who provides an easy way to insert and edit images.
Also it adds ability to manage folder and files on the server (insertion, uploading, deleting).
## Compatibility
Compatible with ExtJs 4.x
##Installation
- put the folder with source code (mediamanager) into /ux/form/;
- add stylesheet MediaManager.css file into index.html;

##Example

````
Ext.require(['Ext.ux.form.mediamanager.MediaManager']);

Ext.onReady(function(){

    Ext.tip.QuickTipManager.init();

    Ext.create('Ext.form.Panel',{
        renderTo: Ext.getBody(),
        title: 'Media plugin',
        width: 700,
        height: 400,
        layout: 'fit',
        items:[{
            xtype: 'htmleditor',
            plugins:[{
                ptype: 'htmleditormedia',
                // the path for stylesheet for editor
                styleSheet: '../src/ux/form/mediamanager/css/editor.css',
                // config for folder proxy
                foldersProxy:{
                    api:{
                        create: Ext.BASE_URL + '/ajax/new.php',
                        read: Ext.BASE_URL + '/ajax/read.php',
                        update: Ext.BASE_URL + '/ajax/new.php',
                        destroy: Ext.BASE_URL + '/ajax/delete.php'
                    }
                },
                // config for images proxy
                imagesProxy:{
                    api:{
                        read: Ext.BASE_URL + '/ajax/load.php',
                        destroy: Ext.BASE_URL + '/ajax/remove.php'
                    }
                },
                // url for file uploading
                uploadUrl: Ext.BASE_URL + '/ajax/upload.php',
                // the root folder for uploading images
                rootFolder: 'images',
                // list of allowed file types
                allowedFiles: ['png', 'jpg'],
                // maximum file size in Mb
                maxFileSize: 2
            }]
        }]
    });
});

````
