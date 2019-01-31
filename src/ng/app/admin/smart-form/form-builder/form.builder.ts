import { Component, AfterViewInit, OnInit, OnDestroy, ViewChild, ElementRef, Input, TemplateRef, ViewEncapsulation  } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from './../../../services/admin.service';
import { DashboardPreloaderService } from '../../../services/dashboard.preloader';
import { Observable } from 'rxjs';

import 'formBuilder/dist/form-builder.min.js';
import 'formBuilder/dist/form-render.min.js';

declare var moment: any;
declare var $: any;


var isAddedSubmitBtn = false;

@Component({
  selector: 'app-admin-form-builder',
  templateUrl: './form.builder.html',
  styleUrls: ['./form.builder.css', './bootstrap.form.builder.min.css'],
  providers: [AdminService, DashboardPreloaderService]
})

export class FormBuilderComponent implements OnInit, AfterViewInit, OnDestroy {

    showPreview = false;

    formBuilderOptions = {
        subtypes : {
            button : ['submit']
        },
        sortableControls  : true,
        disabledSubtypes: {
            textarea : ['quill', 'tinymce'],
            paragraph : ['output', 'canvas']
        },
        disabledActionButtons : ["data", "save"],
        controlOrder: [
            'text',
            'textarea'
        ],
        disableFields: ['autocomplete', 'file', 'hidden', 'button'],
        controlPosition: 'left',
        onOpenFieldEdit: function(editPanel) {

            if($(editPanel).find('.required-wrap').length > 0){
                let checkbox = $(editPanel).find('.required-wrap .input-wrap input[type="checkbox"]');
                let label = $('<label label-required for="'+checkbox.prop('id')+'">Required</label>');
                if( $(editPanel).find('label[label-required]').length > 0 ){
                    $(editPanel).find('label[label-required]').remove();
                }
                label.insertAfter(checkbox);
            }
        },
        onSave: (e, formData) => {
           //  this.showPreview = true;
           // $('#previewContainer').formRender({formData});
        },
        stickyControls: {
            enable: true
        },
        layoutTemplates : {
            /*default : function(field, label, help, data){
                console.log(field, label, help);
                return $('<div></div>');
            }*/
        },
        typeUserEvents : {
            button : {
                onadd: function(fld){
                    $(fld).find('.field-actions').remove();
                    $(fld).css({'pointer-events':'none'});
                }
            }
        },
        onCloseFieldEdit: function(editPanel, b) {
            console.log(editPanel, b);
        },
        onAddField : function(fieldId, fieldData){
            console.log(fieldData, fieldId);
            if(!isAddedSubmitBtn){
                setTimeout(() => {
                    $('#formBuilder').data('formBuilder').actions.addField({
                        type : 'button',
                        className : 'btn btn-warning pull-right',
                        label : 'Submit',
                        subtype : 'submit'
                    });
                    isAddedSubmitBtn = true;
                }, 100);
            }else{
                let 
                data = $('#formBuilder').data('formBuilder').actions.getData(),
                newData = [];

                for(let d of data){
                    if(d.type != 'button'){
                        newData.push(d);
                    }
                }

                $('#formBuilder').data('formBuilder').actions.setData(newData);

                setTimeout(() => {
                    $('#formBuilder').data('formBuilder').actions.addField({
                        type : 'button',
                        className : 'btn btn-warning pull-right',
                        label : 'Submit',
                        subtype : 'submit'
                    });
                    isAddedSubmitBtn = true;
                }, 100);
            }
        }
    }

    constructor(
        private dashboardPreloaderService: DashboardPreloaderService,
        private adminService : AdminService,
        private router : Router
        ){
    }

    ngOnInit(){
        isAddedSubmitBtn = false;
    }

    ngAfterViewInit(){
        let __this = this;
        $('#formBuilder').formBuilder(this.formBuilderOptions);
        $('body').off('click.buttonstyle').on('click.buttonstyle', '.form-group.style-wrap .btn-group button[type="button"]', function(event){
            let 
            formDataInstance = $('#formBuilder').data().formBuilder,
            data = formDataInstance.actions.getData(),
            btn = $(event.target),
            val = btn.attr("value"),
            li = btn.parents("li.button-field"),
            btnParent = btn.parent(),
            allBtns = btnParent.find('button'),
            allBtnColors = [];

            allBtns.each(function(i, elem){
                allBtnColors.push( $(elem).attr('value') );
            });

            let 
            inpClassname = li.find('input[name="className"]'),
            txtClassname = inpClassname.val(),
            arrClassNames = txtClassname.split(" ");
            
            for(let col of allBtnColors){
                if(arrClassNames.indexOf('btn-'+col) > -1){
                    arrClassNames.splice(arrClassNames.indexOf('btn-'+col), 1);
                }
            }

            if(arrClassNames.indexOf('btn') == -1){
                arrClassNames.push('btn');
            }
            arrClassNames.push("btn-"+val);

            inpClassname.val(arrClassNames.join(" "));
        });
        $('select.materialize').material_select();
    }

    saveFormBuilder(){
        let 
        complianceType = $('#selectComplianceType').val(),
        formType = $('#selectFormType').val(),
        formName = $('#formName').val().trim(),
        formBuilderData = $('#formBuilder').data('formBuilder').actions.getData();

        if(
            formBuilderData.length > 0 &&
            complianceType != 'false' &&
            formType != 'false' && 
            formName.length > 0
            ){

            this.dashboardPreloaderService.show();

            this.adminService.saveFormBuilder({
                'name' : formName,
                'compliance_kpis_id' : complianceType,
                'type' : formType,
                'data' : formBuilderData
            }).subscribe(() => {
                this.dashboardPreloaderService.hide();
                this.router.navigate(['/admin/smart-form-list']);
            });

        }

    }

    hidePreview(){
        this.showPreview = false;
    }

    ngOnDestroy(){

    }
}