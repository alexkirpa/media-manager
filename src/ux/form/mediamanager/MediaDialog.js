/**
 * Created by Alex Kirpa (aleksandrkirpa@gmail.com) on 20.06.2016.
 *
 * @class   Ext.ux.form.mediamanager.MediaDialog
 * @extend  Ext.window.Window
 *
 * Defines a new class to manage folders and files on the server.
 *
 */
Ext.define('Ext.ux.form.mediamanager.MediaDialog', {
    extend: 'Ext.window.Window',
    requires: [
        'Ext.data.TreeStore',
        'Ext.layout.container.Border',
        'Ext.tree.Panel',
        'Ext.form.field.FileButton',
        'Ext.form.field.File'
    ],
    title: 'Media manager',
    closeAction: 'hide',
    modal: true,
    height: 500,
    width: 800,
    layout: 'fit',
    cls: 'media-dialog',
    /**
     * @public
     * @property {Boolean} isChild
     * True if the dialog is opened from Image Dialog.
     */
    isChild: false,
    /**
     * @cfg {Object}
     * Defines toolbar buttons state.
     */
    buttonsState: {
        imageSelected: {
            'button_delete': 1,
            'button_insert': 0,
            'button_preview': 1
        },
        imageDeselected: {
            'button_delete': 0,
            'button_insert': 0,
            'button_preview': 0
        },
        folderSelected: {
            'button_upload': 1,
            'button_new_folder': 1,
            'button_delete_folder': 1
        },
        folderDeselected: {
            'button_upload': 0,
            'button_new_folder': 0,
            'button_delete_folder': 0
        },
        init: {
            'button_delete': 0,
            'button_insert': 0,
            'button_preview': 0,
            'button_upload': 0,
            'button_new_folder': 0,
            'button_delete_folder': 0
        }
    },
    initComponent: function() {
        var me = this;

        me.addEvents({
            /**
             * @event insert
             * Fires after the button `Insert` has pressed or the image has double clicked. event on the image.
             * @param {String} url
             */
            insert: true
        });

        Ext.apply(me, {
            items: [{
                xtype: 'panel',
                border: false,
                layout: {
                    type: 'border',
                    regionWeights: {
                        west: 20,
                        north: 10,
                        south: -10,
                        east: -20
                    }
                },
                items: [{
                    region: 'north',
                    height: 25,
                    border: false,
                    style: {
                        borderStyle: 'solid',
                        borderWidth: '0 0 0 1px'
                    },
                    layout: 'anchor',
                    items: [{
                        xtype: 'displayfield',
                        margin: '0 0 2 3',
                        value: 'Root:  '
                    }]
                },{
                    xtype: 'treepanel',
                    region: 'west',
                    border: false,
                    style: {
                        borderStyle: 'solid',
                        borderWidth: '0 1px 0 0'
                    },
                    width: 250,
                    split: true,
                    store: Ext.create('Ext.data.TreeStore', {
                        storeId: null,
                        fields: [
                            {name: 'text', type: 'string'},
                            // there is no need to save this field on the server
                            {name: 'leaf', type: 'boolean', persist: false}
                        ],
                        proxy: me.createProxy(me.foldersProxy)
                    }),
                    listeners: {
                        selectionchange: me.onFolderChange,
                        scope: me
                    }
                },{
                    xtype: 'panel',
                    region: 'center',
                    layout: 'fit',
                    border: false,
                    style: {
                        borderStyle: 'solid',
                        borderWidth: '1px 0 0 1px'
                    },
                    items: [{
                        xtype: 'dataview',
                        overflowY: 'auto',
                        componentCls: 'media-dialog-view',
                        store: Ext.create('Ext.data.Store', {
                            storeId: null,
                            fields: [
                                {name: 'name'},
                                {name: 'url'},
                                {name: 'size', type: 'float'},
                                {name:'lastmod', type: 'date', dateFormat: 'timestamp'}
                            ],
                            proxy: me.createProxy(me.imagesProxy),
                            sorters: [{
                                property: 'lastmod',
                                direction: 'DESC'
                            }]
                        }),
                        tpl: [
                            '<tpl for=".">',
                            '<div class="thumb-wrap" id="{name:stripTags}">',
                            '<div class="thumb"><img src="{url}" title="File: {name:htmlEncode}&#10;Size: {sizeString}&#10;Last modified: {dateString}"></div>',
                            '<span class="x-editable">{shortName:htmlEncode}</span>',
                            '</div>',
                            '</tpl>',
                            '<div class="x-clear"></div>'
                        ],
                        overItemCls: 'x-item-over',
                        itemSelector: 'div.thumb-wrap',
                        emptyText: 'No images to display',
                        prepareData: function(data) {
                            var size = '';
                            if (Ext.isNumeric(data.size)) {
                                size = Ext.util.Format.fileSize(data.size);
                            }
                            Ext.apply(data, {
                                shortName: Ext.util.Format.ellipsis(data.name, 15),
                                sizeString: size,
                                dateString: Ext.util.Format.date(data.lastmod, "m/d/Y g:i a")
                            });
                            return data;
                        },
                        listeners: {
                            selectionchange: me.onImageChange,
                            itemdblclick: me.insertImage,
                            scope: me
                        }
                    }]
                }]
            }],
            dockedItems: [{
                xtype: 'toolbar',
                dock: 'top',
                items: [{
                    xtype: 'filebutton',
                    text: 'Upload',
                    itemId: 'button_upload',
                    tooltip: 'Upload file',
                    iconCls: 'icon-upload',
                    listeners: {
                        change: me.uploadFile,
                        scope: me
                    }
                },{
                    text: 'New folder',
                    itemId: 'button_new_folder',
                    tooltip: 'Create new folder',
                    iconCls: 'icon-folder-add',
                    handler: me.createNewFolder,
                    scope: me
                },{
                    text: 'Delete folder',
                    itemId: 'button_delete_folder',
                    tooltip: 'Delete folder',
                    iconCls: 'icon-folder-delete',
                    handler: me.deleteFolder,
                    scope: me
                }, '', '-', '', {
                    text: 'Insert',
                    itemId: 'button_insert',
                    tooltip: 'Insert selected image',
                    iconCls: 'icon-accept',
                    handler: me.insertImage,
                    scope: me
                },{
                    // TO DO
                    text: 'Preview',
                    itemId: 'button_preview',
                    hidden: true,
                    tooltip: 'Preiview image',
                    iconCls: 'icon-zoom'
                }, '->', {
                    text: 'Delete',
                    itemId: 'button_delete',
                    tooltip: 'Delete selected image',
                    iconCls: 'icon-delete',
                    handler: me.deleteImage,
                    scope: me
                }]
            }]
        });

        me.callParent();
    },
    /**
     * @private
     */
    onShow: function() {
        var me = this,
            root, tree;
        me.callParent(arguments);
        // if the window is opend directly from a htmleditor the button `Insert` should be disabled.
        me.buttonsState.imageSelected.button_insert = me.isChild ? 1 : 0;
        me.switchButtons('init');

        tree = me.getFolderTree();
        root = tree.setRootNode({
            text: me.rootFolder,
            id: me.rootFolder
        });
        tree.getSelectionModel().select(root);
    },
    /**
     * @private
     * @param {Ext.selection.Model} sm
     * @param {Ext.data.Model[]} selected
     */
    onFolderChange: function(sm, selected) {
        var me = this,
            path = '',
            node = selected[0],
            state = 'folderDeselected';

        if (node) {
            state = 'folderSelected';
            path = node.get('id');

            me.loadImages(path);
            node.expand();
        }

        me.displayCurrentFolderPath(path);
        me.switchButtons(state);
    },
    displayCurrentFolderPath: function(path) {
        this.down('[region=north]').down('displayfield').setValue('Root: ' + path);
    },
    /**
     * @private
     * @param {Ext.selection.Model} sm
     * @param {Ext.data.Model[]} selected
     */
    onImageChange: function(sm, selected) {
        var state = selected.length ? 'imageSelected' : 'imageDeselected';

        this.switchButtons(state);
    },
    /**
     * @private
     * Checks the file type extensions.
     * @param {String} name The file name.
     * @returns {String} error The error message or an empty string.
     */
    getFileTypeError: function(name) {
        var me = this,
            parts, ext;
        // We can defines false if we don't want to validate file type.
        if (!me.allowedFiles) {
            return '';
        }
        if (!Ext.isArray(me.allowedFiles)) {
            Ext.Error.raise('Property "allowedFiles" must be an array!');
        }

        parts = name.split('.');

        if (parts.length > 1) {
            ext = parts.pop();
            if (!ext) {
                // There is no extensions - that means that file is invalid.
                return 'Invalid file name!';
            }
            return Ext.Array.contains(me.allowedFiles, ext) ? '' : 'Invalid file type! Allowed: ' + me.allowedFiles.join(', ') + '.';
        } else {
            return 'Invalid file name!';
        }
    },
    /**
     * @private
     * Checks the file size.
     * @param {Number} size
     * @returns {String} error The error message or an empty string.
     */
    getFileSizeError: function(size) {
        var me = this,
            max = me.maxFileSize;

        if (!max) {
            // If `maxFileSize` property is not defined or is zero - the file is valid.
            return '';
        }
        if ((size / 1048576) > max) {
            return 'File size is larger ' + max + ' Mb!';
        }
        return '';
    },
    /**
     * @private
     * Checks file type and file size.
     * @param files
     * @returns {String[]}
     */
    validateFile: function(files) {
        var me = this,
            msg, errors = [];

        msg = me.getFileTypeError(files[0].name);
        if (msg) {
            errors.push(msg);
        }
        msg =  me.getFileSizeError(files[0].size);
        if (msg) {
            errors.push(msg);
        }
        return errors;
    },
    /**
     * @private
     * @param {Ext.form.field.FileButton} button
     *
     */
    uploadFile: function(button) {
        var me = this,
            selected = me.getFolderTree().getSelectionModel().getSelection(),
            files = button.fileInputEl.dom.files,
            node = selected[0],
            form, errors;

        if (node && files && files.length) {
            errors = me.validateFile(files);

            if (!Ext.isEmpty(errors)) {
                Ext.Msg.show({
                    title: 'Media manager',
                    msg: errors.join('<br>'),
                    buttons: Ext.Msg.OK,
                    icon: Ext.Msg.ERROR
                });
                return;
            }

            if (!me._uploadForm) {
                me._uploadForm = Ext.create('Ext.form.Panel',{
                    hidden: true,
                    renderTo: me.el,
                    items: [{
                        xtype: 'filefield',
                        name: 'file'
                    }]
                });
            }

            me._uploadForm.down('[name=file]').fileInputEl.dom.files = files;

            me._uploadForm.submit({
                url: me.uploadUrl,
                params: {
                    folder: node.get('id')
                },
                success: function() {
                    me.loadImages(node.get('id'));
                },
                failure: function(form, action) {
                    var msg = action.failureType === Ext.form.action.Action.SERVER_INVALID ? action.result.message : '';
                    Ext.Msg.show({
                        title: 'Media manager',
                        msg: 'There was an error uploading the file!',
                        buttons: Ext.Msg.OK,
                        icon: Ext.Msg.ERROR
                    });
                    Ext.log({msg: Ext.String.format('There was an error uploading the file: "{0}"', msg)});
                }
            });
        }
    },
    /**
     * @private
     */
    deleteFolder: function() {
        var me = this,
            tree = me.getFolderTree(),
            selected = tree.getSelectionModel().getSelection(),
            node;

        if (selected.length) {
            node = selected[0];
            Ext.Msg.show({
                title: 'Media manager',
                msg: Ext.String.format('Are you sure you want to delete the folder: {0}?', node.get('text')),
                buttons: Ext.Msg.YESNO,
                icon: Ext.Msg.QUESTION,
                fn: function(button) {
                    var parent;
                    if (button === 'yes') {
                        // We can remove only an empty folder. The tree node includes only child folders.
                        // To check files that may be in the deleting folder we must use getCount method from Images Store.
                        if (node.hasChildNodes() || me.getImageView().getStore().getCount()) {
                            Ext.Msg.show({
                                title: 'Media manager',
                                msg: 'You cannot delete not empty folder!',
                                buttons: Ext.Msg.OK,
                                icon: Ext.Msg.ERROR
                            })
                            return;
                        }

                        parent = node.parentNode;
                        node.remove();

                        tree.getStore().sync({
                            success: function() {
                                // if the folder was the last in parent folder - set leaf true for parent folder.
                                if (!parent.hasChildNodes()) {
                                    parent.set('leaf', true);
                                }
                            },
                            failure: function(batch, options) {
                                var error = batch.operations[0].error,
                                    msg = error && typeof(error) !== 'object'  ? error : '';
                                Ext.Msg.show({
                                    title: 'Media manager',
                                    msg: 'There was an error uploading the folder!',
                                    buttons: Ext.Msg.OK,
                                    icon: Ext.Msg.ERROR
                                });
                                // after error should return the folder back to its place in the tree
                                parent.appendChild(node);
                                Ext.log({msg: Ext.String.format('There was an error uploading the folder: "{0}"', msg)});
                            }
                        });
                    } // if
                }// fn
            });
        }// if
    },
    /**
     * @private
     */
    createNewFolder: function() {
        var me = this,
            tree = me.getFolderTree(),
            selected = tree.getSelectionModel().getSelection();

        if (selected.length) {
            Ext.Msg.prompt('Media manager', 'Please enter folder name', function(button, text) {
                var node, child;
                if (button === 'ok') {
                    node = selected[0];
                    if (node.hasChildNodes() && node.findChild('text', text)) {
                        Ext.Msg.show({
                            title: 'Media manager',
                            msg: 'Folder with that name already exists!',
                            buttons: Ext.Msg.OK,
                            icon: Ext.Msg.ERROR
                        });
                        return;
                    }
                    child = node.appendChild({
                        text: text,
                        leaf: true
                    });

                    tree.getStore().sync({
                        success: function() {
                            if (!node.isExpanded()) {
                                node.set('leaf', false);
                                node.expand();
                            }
                         },
                        failure: function(batch, options) {
                            var error = batch.operations[0].error,
                                msg = error && typeof(error) !== 'object' ? error : '';
                            Ext.Msg.show({
                                title: 'Media manager',
                                msg: 'There was an error creating the folder!',
                                buttons: Ext.Msg.OK,
                                icon: Ext.Msg.ERROR
                            });
                            node.removeChild(child);
                            Ext.log({msg: Ext.String.format('There was an error creating the folder: "{0}"', msg)});
                        }
                    });
                } // if
            }, me, false, 'newfolder');
        }// if
    },
    /**
     * @private
     * Fire `insert` event.
     */
    insertImage: function() {
        var me = this,
            selected = me.getImageView().getSelectionModel().getSelection();

        if (selected.length && me.isChild) {
            me.fireEventArgs('insert', [selected[0].get('url')]);
            me.close();
        }
    },
    /**
     * @private
     */
    deleteImage: function() {
        var me = this,
            view = me.getImageView(),
            store = view.getStore(),
            selected = view.getSelectionModel().getSelection();

        if (!selected.length){
            return;
        }

        Ext.Msg.show({
            title: 'Media manager',
            msg: 'Are you sure you want to delete the selected images?',
            buttons: Ext.Msg.YESNO,
            icon: Ext.Msg.QUESTION,
            fn: function(button) {
                if (button === 'yes') {
                    store.remove(selected);
                    store.sync({
                        failure: function(batch, options) {
                            var error = batch.operations[0].error,
                                msg = error && typeof(error) !== 'object' ? error : '';
                            store.rejectChanges();
                            Ext.Msg.show({
                                title: 'Media manager',
                                msg: 'There was an error deleting the image!',
                                buttons: Ext.Msg.OK,
                                icon: Ext.Msg.ERROR
                            });
                            Ext.log({msg: Ext.String.format('There was an error deleting the image: "{0}"', msg)});
                        }
                    });
                }// if
            }// fn
        });

    },
    /**
     * @private
     * Download files from a folder that is defined in `path`.
     * @param {String} path The path to current folder.
     */
    loadImages: function(path) {
        this.getImageView().getStore().load({
            params: {
                path: path
            },
            callback: function(records, operations, success) {
                var error, msg;
                if (!success) {
                    error = operations.error;
                    msg = error && typeof(error) !== 'object' ? error : '';
                    Ext.Msg.show({
                        title: 'Media manager',
                        msg: 'There was an error uploading the image!',
                        icon: Ext.Msg.ERROR,
                        buttons: Ext.Msg.OK
                    });
                    Ext.log({msg: Ext.String.format('There was an error uploading the image: "{0}"', msg), level: 'log'});
                }
            }
        });
    },
    /**
     * @private
     * Switch button state.
     * @param {String} itemId
     * @param {Number} on
     */
    switchButton : function(itemId, on) {
        var button = this.getButton(itemId);

        if (button) {
            if (on) {
                button.enable();
            } else {
                button.disable();
            }
        }
    },
    /**
     * @private
     * Sets a toolbar buttons state (enable/disable).
     * @param {String} state
     */
    switchButtons: function(state) {
        var me = this,
            itemId,
            info = me.buttonsState[state];

        if (info === undefined) {
            Ext.Error.raise('Wrong button state: ' + state);
        }
        for (itemId in info) {
            me.switchButton(itemId, info[itemId]);
        }
    },
    getButton: function(itemId) {
        return this.down('toolbar[dock=top]').down('#' + itemId);
    },
    getFolderTree: function() {
        return this.down('treepanel');
    },
    getImageView: function() {
        return this.down('[region=center] dataview');
    },
    /**
     * @private
     * Returns the config object for a store proxy.
     * @param {Object} config
     * @returns {Object}
     */
    createProxy: function(config) {
        var me = this, proxy;

        if (!config) {
            Ext.Error.raise('Plugin htmleditormedia require proxy!');
        }
        if (!config.api) {
            Ext.Error.raise('Proxy api is required!');
        }
        if (config.type === undefined || config.type === 'ajax') {
            proxy = {
                type: 'ajax'
            };
        } else if (config.type === 'direct') {
            proxy = {
                type: 'direct'
            };
        } else {
            Ext.Error.raise('Invalid proxy type (' + config.type + ')!');
        }

        proxy.api = config.api;

        proxy.reader = {
            type: 'json',
            root: 'data',
            messageProperty: 'message'
        };

        return proxy;
    }
});
