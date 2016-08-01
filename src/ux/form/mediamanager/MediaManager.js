/**
 * Created by Alex Kirpa (aleksandrkirpa@gmail.com)
 *
 * @class   Ext.ux.form.mediamanager.MediaManager
 * @extend  Ext.AbstractPlugin
 *
 * This plugin adds functionality for Ext.form.field.HtmlEditor which provides an easy way to insert and edit images.
 * Also it adds ability to manage folder and files on the server (insertion, uploading, deleting).
 *
 */

Ext.define('Ext.ux.form.mediamanager.MediaManager', {
    alias: 'plugin.htmleditormedia',
    extend: 'Ext.AbstractPlugin',
    requires:[
        'Ext.ux.form.mediamanager.ImageDialog',
        'Ext.ux.form.mediamanager.MediaDialog'
    ],
    /**
     * @cfg {String[]} managerConfigs
     * Defines a list of properties to copy to Media dialog.
     *
     */
    managerConfigs: ['allowedFiles', 'maxFileSize','foldersProxy', 'imagesProxy', 'rootFolder', 'uploadUrl'],
    /**
     * @cfg {String} styleSheet
     * The style sheet to be applied to this editor's content.
     *
     * @example
     * styleSheet: '../../ext/examples/ux/form/mediamanager/css/editor.css'
     */

    /**
     * @cfg {Object} alignCls
     * Defines classes for image alignment. Key - alignment type, value - the class that will be added to the image tags.
     */
    alignCls: {
        left: 'left',
        right: 'right',
        center: 'center',
        none: ''
    },
    /**
     * @cfg {String} baseCls
     * The CSS class to be added to every image elements.
     */
    baseCls: 'html_editor_image',
    /**
     * @cfg {Object} buttonTips
     * The tooltips for the buttons that will be added to the htmleditor.
     */
    buttonTips: {
        image: {
            title: 'Image',
            text: 'Insert/Edit image',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
        },
        media: {
            title: 'Media',
            text: 'Open media manager',
            cls: Ext.baseCSSPrefix + 'html-editor-tip'
        }
    },
    /**
     * @cfg {Array} allowedFiles
     * An array of allowed file extensions that can be uploaded to the server.
     * You can assign `false` to skip the file type validation.
     *
     */
    allowedFiles: ['png', 'jpg', 'jpeg', 'gif'],
    /**
     * @cfg {Number} maxFileSize // Mb
     * The maximum file size  in Mb to upload to the server.
     * 0 to skip validation.
     */
    maxFileSize: 0,
    /**
     * @cfg {String} rootFolder
     * Defines the root folder for images.
     *
     * @example
     * rootFolder: 'images'
     */
    rootFoolder: 'images',
    /**
     * @cfg {String} uploadUrl
     * The URL for file uploading.
     *
     * @example
     * uploadUrl: Ext.BASE_URL + '/media/upload'
     */

    /**
     * @cfg {Object} foldersProxy
     * The Proxy to use for `folder store`.
     * @example
     *   foldersProxy: {
     *      type: 'ajax',
     *      api: {
     *          create: Ext.BASE_URL + '/media/new',
     *          read: Ext.BASE_URL + '/media/read',
     *          update: Ext.BASE_URL + '/media/new',
     *          destroy: Ext.BASE_URL + '/media/delete'
     *      }
     *   }
     *
     */

    /**
     * @cfg {Object} imagesProxy
     * The Proxy to use for `image store`.
     * @example
     * imagesProxy: {
     *   type: 'ajax',
     *      api: {
     *          read: Ext.BASE_URL + '/media/load',
     *          destroy: Ext.BASE_URL + '/media/remove'
     *      }
     *   }
     *
     */

    /**
     * @private
     * @param {Ext.form.field.HtmlEditor} editor
     */
    init: function(editor) {
        var me = this,
            task,
            fn;

        me.editor = editor;
        editor.mediaPlugin = me;
        // add model for image properties
        me.model = Ext.define('Ext.ux.form.mediamanager.MediaManager.ImageModel', {
            extend: 'Ext.data.Model',
            fields: ['phantom', 'src', 'alt', 'align', 'width', 'height']
        });

        //
        Ext.override(editor,{
            /**
             * @protected
             * baseCls and `selected` are used only in editor.
             * We have to delete these classes before sending content into the textarea.
             * The `syncValue` method is the best place to do this.
             */
            syncValue: function() {
                var me = this,
                    plugin = me.mediaPlugin,
                    doc = this.getDoc(),
                    img, images,
                    select = Ext.DomQuery.select;

                img = select('img.selected', doc)[0];
                images = select('img', doc);
                Ext.each(images, function(item) {
                    Ext.fly(item).removeCls([plugin.baseCls, 'selected']);
                });

                me.callParent(arguments);

                Ext.each(images, function(item) {
                    Ext.fly(item).addCls(plugin.baseCls);
                });
                // if the image was selected - add `selected` class
                if (img) {
                    Ext.fly(img).addCls('selected');
                }
            }
        });
        // Add event listeners and style sheet for editor.
        // Start polling for when the iframe document is ready to be manipulated.
        task = {
            run: function() {
                try { //Destroying the component during/before delay can cause issues
                    var doc = this.getDoc(),
                        link;

                    // When editor is initializing all event listeners are removing.
                    // so  we have to add the listeners after the editor will be initialized
                    if (doc && doc.editorInitialized) {
                        Ext.EventManager.on(doc, {
                            click: me.onEditorEvent,
                            dblclick: me.onEditorEvent,
                            keyup: me.onEditorEvent,
                            scope: me
                        });

                        Ext.DomHelper.append(doc.head, {
                            tag: 'link',
                            rel: 'stylesheet',
                            href: me.styleSheet
                        });

                        Ext.TaskManager.stop(task);
                    }
                } catch (e) {
                    Ext.TaskManager.stop(task);
                }
            },
            interval: 100,
            scope: editor
        };
        Ext.TaskManager.start(task);

        me.initToolbar();
    },
    destroy: function() {
        var me = this,
            editor = me.editor;
        if (editor) {
            editor.mediaPlugin = me.editor = null;
        }
    },
    /**
     * @private
     * Select/deselect image.
     * @param event
     * @param target
     */
    onEditorEvent: function(event, target) {
        var me = this,
            type = event.type,
            doc = me.editor.getDoc(),
            selectedEl = Ext.DomQuery.select('img.selected', doc)[0];

        // at first clear the selection
        if (selectedEl) {
            Ext.fly(selectedEl).removeCls('selected');
        }

        if (type === 'keyup' || target.tagName.toLowerCase() !== 'img') {
            return
        }

        // select new image
        Ext.fly(target).addCls('selected');

        if (type === 'dblclick') {
            me.showImageDialog();
        }
    },
    /**
     * @private
     */
    initToolbar: function() {
        var me = this,
            undef,
            tipsEnabled = Ext.quickTipsActive && Ext.tip.QuickTipManager.isEnabled(),
            tips = me.buttonTips;

        me.editor.getToolbar().add('-',
            {
                iconCls: 'icon-image',
                itemId: 'button_image',
                scope: me,
                handler: me.showImageDialog,
                clickEvent: 'mousedown',
                tooltip: tipsEnabled ? tips.image || undef : undef,
                overflowText: tips.image.title || undef,
                tabIndex: -1
            },{
                iconCls: 'icon-media',
                itemId: 'button_media',
                scope: me,
                handler: me.showMediaDialog,
                clickEvent: 'mousedown',
                tooltip: tipsEnabled ? tips.media || undef : undef,
                overflowText: tips.media.title || undef,
                tabIndex: -1
            }
        );
    },
    /**
     * @private
     * @param {Ext.ux.form.mediamanager.MediaManager.ImageModel} config
     *
     */
    onSave: function(config) {
        var me = this,
            doc = me.editor.getDoc(),
            img = Ext.DomQuery.select('img.selected', doc)[0];

        if (!img){
            me.insertImage(config);
        } else {
            me.updateImage(img, config);
        }
    },
    /**
     * @private
     * Insert new image into content.
     * @param {Ext.ux.form.mediamanager.MediaManager.ImageModel} config
     */
    insertImage: function(config) {
        var me = this,
            html;
        if (!config.get('src')){
            return;
        }
        html = Ext.String.format('<img class="{0} {1}" src="{2}" width="{3}" height="{4}" alt="{5}" />',
            me.baseCls, me.alignCls[config.get('align')] || '', config.get('src'), config.get('width'), config.get('height'), config.get('alt'));
        me.editor.insertAtCursor(html);
    },
    /**
     * @private
     * Update image attributes.
     * @param {HTMLElement} img
     * @param {Ext.ux.form.mediamanager.MediaManager.ImageModel} config
     */
    updateImage: function(img, config) {
        var me = this,
            el = Ext.fly(img);

        if (config.get('src')) {
            el.removeCls(Ext.Object.getValues(me.alignCls));
            el.addCls(me.alignCls[config.get('align')]);

            el.set({
                src: config.get('src'),
                width: config.get('width'),
                height: config.get('height'),
                alt: config.get('alt')
            });
        } else {
            // If src is empty - it means that we want to delete image.
            el.remove();
        }
    },
    /**
     * @private
     * @returns {Ext.ux.form.mediamanager.ImageDialog}
     */
    getImageDialog: function() {
        var me = this;

        if (!me._imageDialog) {
            me._imageDialog = Ext.create('Ext.ux.form.mediamanager.ImageDialog', {
                getMediaDialog: Ext.bind(me.getMediaDialog, me)
            });
            me._imageDialog.on('save', me.onSave, me);
        }

        return me._imageDialog;
    },
    /**
     * @private
     * @returns {Ext.ux.form.mediamanager.MediaDialog}
     */
    getMediaDialog: function() {
        var me = this,
            props, cfg,  prop, i, len, hasOwn;

        if (!me._mediaDialog){
            cfg = {};
            props = me.managerConfigs;
            hasOwn = Object.prototype.hasOwnProperty;
            for (i = 0, len = props.length; i < len; i += 1){
                prop = props[i];
                cfg[prop] = me[prop];
             }
            me._mediaDialog = Ext.create('Ext.ux.form.mediamanager.MediaDialog', cfg);
        }

        return me._mediaDialog;
    },
    /**
     * @private
     */
    showImageDialog: function() {
        var me = this,
            doc = me.editor.getDoc(),
            dialog = me.getImageDialog(),
            cfg = me.getImageProperties(Ext.DomQuery.select('img.selected', doc)[0]);

        dialog.show(cfg);
    },
    /**
     * @private
     */
    showMediaDialog: function() {
        var me = this,
            dialog = me.getMediaDialog();

        dialog.isChild = false;
        dialog.show();
    },
    /**
     * @private Return an object that contain the image properties.
     * @param {HTMLElement} Selected image or null if the window is opened to add new image.
     * @returns {Ext.ux.form.mediamanager.MediaManager.ImageModel}
     */
    getImageProperties: function(image) {
        var me = this,
            align = 'none',
            classNames,
            prop = {
                phantom: true,
                src: '',
                width: 0,
                height: 0,
                align: align,
                alt: ''
            };

        if (image) {
            classNames = image.className;
            Ext.iterate(me.alignCls, function(key, value) {
                if (classNames.indexOf(value) > -1) {
                    align = key;
                    return false;
                }
            });
            prop = {
                phantom: false,
                src: image.src,
                width: image.width,
                height: image.height,
                align: align,
                alt: image.alt
            };
        }

        return Ext.create(me.model, prop);
    }
});
