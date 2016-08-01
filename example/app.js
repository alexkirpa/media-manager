/**
 * Created by alex on 28.06.2016.
 */

Ext.Loader.setConfig({
    enabled: true,
    paths:{
        'Ext.ux': '../src/ux'
    }
});

Ext.BASE_URL = 'data';

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
