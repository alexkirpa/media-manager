/**
 * Created by Alex Kirpa (aleksandrkirpa@gmail.com) on 20.06.2016.
 *
 * @class   Ext.ux.form.mediamanager.ImageDialog
 * @extend  Ext.window.Window
 *
 * Defines a new class that allows to insert new image or edit properties of the existing image.
 */
Ext.define('Ext.ux.form.mediamanager.ImageDialog', {
    extend: 'Ext.window.Window',
    xtype: 'imagedialog',
    closeAction: 'hide',
    title: 'Image properties',
    modal: true,
    height: 400,
    width: 500,
    resizable: false,
    layout: 'fit',
    initComponent: function() {
        var me = this;

        me.addEvents({
            /**
             * @event save
             * Fires after the button has pressed.
             * @param {Ext.ux.form.mediamanager.MediaManager.ImageModel} rec
             */
            save: true
        });

        Ext.apply(me, {
            items:[{
                xtype: 'form',
                border: false,
                bodyPadding: 10,
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                fieldDefaults: {
                    labelAlign: 'top'
                },
                items: [{
                    xtype: 'fieldcontainer',
                    layout: 'hbox',
                    items: [{
                        xtype: 'textfield',
                        fieldLabel: 'Link',
                        name: 'src',
                        flex: 1,
                        listeners: {
                            blur: me.onBlur,
                            scope: me
                        }
                    },{
                        xtype: 'button',
                        text: 'Choose from server',
                        margin: '18 0 0 5',
                        tooltip: 'Choose file from server',
                        handler: me.showMediaDialog,
                        scope: me
                    }]
                },{
                    xtype: 'textfield',
                    fieldLabel: 'Alternative text',
                    name: 'alt'
                },{
                    xtype: 'container',
                    flex: 1,
                    layout: {
                        type: 'hbox',
                        align: 'stretch'
                    },
                    items: [{
                        xtype: 'container',
                        width: 130,
                        layout: 'vbox',
                        items: [{
                            xtype: 'fieldcontainer',
                            layout: 'hbox',
                            items: [{
                                xtype: 'numberfield',
                                fieldLabel: 'Width',
                                name: 'width',
                                width: 70,
                                minValue: 0,
                                allowDecimals: false,
                                listeners: {
                                    change: me.onChange,
                                    scope: me
                                }
                            },{
                                xtype: 'displayfield',
                                value: 'px',
                                margin: '15 0 0 5'
                            }]
                        },{
                            xtype: 'fieldcontainer',
                            layout: 'hbox',
                            items: [{
                                xtype: 'numberfield',
                                fieldLabel: 'Height',
                                name: 'height',
                                width: 70,
                                minValue: 0,
                                allowDecimals: false,
                                listeners: {
                                    change: me.onChange,
                                    scope: me
                                }
                            },{
                                xtype: 'displayfield',
                                value: 'px',
                                margin: '15 0 0 5'
                            }]
                        },{
                            xtype: 'combo',
                            fieldLabel: 'Align',
                            name: 'align',
                            store: Ext.create('Ext.data.Store', {
                                fields: ['id', 'name'],
                                data: [
                                    {id: 'none', name: 'Not set'},
                                    {id: 'left', name: 'Left'},
                                    {id: 'center', name: 'Center'},
                                    {id: 'right', name: 'Right'}
                                ]
                            }),
                            valueField: 'id',
                            displayField: 'name',
                            forceSelection: true,
                            width: 90,
                            value: 'none'
                        }]
                    },{
                        xtype: 'container',
                        flex: 1,
                        autoScroll: true,
                        margin: '5 0 0 0',
                        padding: 2,
                        border: true,
                        style: {
                            borderWidth: 1,
                            borderStyle: 'solid',
                            borderColor: '#B5B8C8'
                        },
                        items: [{
                            xtype: 'image'
                        }]
                    }]
                }]
            }],
            buttons: [{
                text: 'Ok',
                itemId: 'button_ok',
                handler: me.save,
                scope: me
            },{
                text: 'Cancel',
                handler: me.close,
                scope: me
            }]
        });

        me.callParent();
    },
    getMediaDialog: Ext.emptyFn,
    /**
     * @private
     */
    showMediaDialog: function() {
        var me = this,
            media = me.getMediaDialog();

        if (!me._initializedListener) {
            media.on('insert', me.updateSrc, me);
            me._initializedListener = true;
        }

        media.isChild = true;
        media.show();
    },
    /**
     * @private
     * @param {String} path
     *
     */
    updateSrc: function(path) {
        var field = this.getForm().findField('src');

        field.setValue(path);
        field.fireEvent('blur', field);
    },
    /**
     * @private
     * @param {Ext.form.field.Text} field
     */
    onBlur: function(field) {
        var me = this,
            img = me.getImage(),
            dom = img.imgEl.dom,
            src = field.getValue(),
            form = me.getForm(),
            el;

        if (dom.src !== src) {
            if (src){
                el = Ext.fly(dom);

                el.setStyle({
                    height: null,
                    width: null
                });
                el.on('load',
                    function() {
                        var size = img.getSize();
                        form.setValues({
                            width: size.width,
                            height: size.height
                        });
                    }, me, {single: true}
                );
            } else {
                // Ext.Image component uses 1x1 transparent gif image (Ext.BLANK_IMAGE_URL) when src is empty.
                form.setValues({
                    width: 0,
                    height: 0
                });
            }
            img.setSrc(src);
        }
    },
    getForm: function() {
        return this.down('form').getForm();
    },
    /**
     * @private
     * @param {Ext.form.field.Number} field
     * @param {Number} newValue
     * @param {Number} oldValue
     */
    onChange: function(field, newValue, oldValue) {
        var values = this.getForm().getFieldValues();
        this.getImage().setSize(values.width, values.height);
    },
    /**
     * @public
     * Shows the image properties window.
     * @param {Ext.ux.form.mediamanager.MediaManager.ImageModel} rec
     *
     * Overrides: Ext.window.Window.show
     */
    show: function(rec) {
        var me = this;

        me.callParent();

        me.getImage().setSrc(rec.get('src'));
        me.getForm().loadRecord(rec);
    },
    /**
     * @private
     * Fires `save` event.
     */
    save: function() {
        var me = this,
            form = me.getForm();

        console.profile("processPixels()");

        form.updateRecord();
        me.fireEventArgs('save', [form.getRecord()]);
        me.close();

        console.profileEnd();
    },
    getImage: function() {
        return this.down('image');
    }
});
