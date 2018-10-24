import { Component, OnInit, ViewEncapsulation, OnDestroy, OnChanges, ElementRef, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { AuthService } from '../../services/auth.service';
import { LocationsService } from '../../services/locations';
import { DonutService } from '../../services/donut';
import { UserService } from '../../services/users';
import { Countries } from '../../models/country.model';
import { Observable } from 'rxjs/Rx';
import { MessageService } from '../../services/messaging.service';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { ComplianceService } from '../../services/compliance.service';

declare var $: any;
declare var Materialize: any;
@Component({
    selector: 'app-view-locations-single',
    templateUrl: './view-single.component.html',
    styleUrls: ['./view-single.component.css'],
    providers: [DashboardPreloaderService, EncryptDecryptService, DonutService, ComplianceService]
})
export class ViewSingleLocation implements OnInit, OnDestroy, OnChanges {

	private countries = new Countries().getCountries();
	userData: Object;
	encryptedID;
    locationID = 0;
    isHome = false;
    locationData = {
        location_id : 0,
        parent_id: 0 ,
        name : '',
        frp : [],
        unit : '',
        street : '',
        city : '',
        country : '',
        google_photo_url: '',
        formatted_address: '',
        sublocations : [],
        is_building : 0,
        admin_verified : 0,
        parent : {
            name : <any> false, is_building : 0
        }
    };
    private sub;
    private loc_sub;
    errorMessageModalSublocation = '';
    showLoaderModalSublocation = false;
    selectedLocationToArchive = {};

    public locationsSublocations = [];

    public sameSublocation = [];
    public sameSublocationCopy = [];
    public inpSublocationNameTwoWayData = "";
    public selectedSubLocationFromModal = {};
    public locationToApplyActionTo;
    @ViewChild('inputSublocation') public inputSublocation: ElementRef;
    @ViewChild('formAddTenant') formAddTenant : NgForm;

    mutationOversable;

    showModalEditLoader = false;
    toEditLocations = [];
    toEditLocationsBackup = [];
    showLoadingCompliance = true;

    showModalNewTenantLoader = false;
    selectedLocation = {
        name : '',
        location_id : '',
        sublocations : []
    };

    showLoadingSublocations = false;
    emailTaken = false;

    breadCrumbs = [];

    modalArchive = {
        loader : false
    };

    selectedArchive = {
        length : 0
    };

    paramArchived = <any> false;

    constructor(
        private auth: AuthService,
        private preloaderService: DashboardPreloaderService,
        private locationService: LocationsService,
        private encryptDecrypt: EncryptDecryptService,
        private route: ActivatedRoute,
        private router: Router,
        private donut: DonutService,
        private elemRef: ElementRef,
        private messageService: MessageService,
        private complianceService: ComplianceService,
        private userService: UserService
        ){
        this.userData = this.auth.getUserData();

        this.mutationOversable = new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                if(mutation.target.nodeName != '#text'){
                    let target = $(mutation.target);
                    if(target.find('select.select-from-row:not(.initialized)').length > 0){

                        target.find('select.select-from-row:not(.initialized)').material_select();
                    }
                }
            });
        });

        this.mutationOversable.observe(this.elemRef.nativeElement, { childList: true, subtree: true });

        this.messageService.getMessage().subscribe((msg) => {
          console.log(msg);
          if (msg.id === 'warden-benchmarking-calculator') {
            $('#modalWardenBenchmarkCalc').modal('close');
            this.preloaderService.show();
            this.loc_sub = this.locationService.getById(this.locationID, (response) => {
                setTimeout(() => {
                    this.preloaderService.hide();
                }, 250);
                this.locationData.name = response.location.name;
                this.locationData.is_building = response.location.is_building;
                this.locationData.formatted_address = response.location.formatted_address;
                this.locationData.sublocations = response.sublocations;
                this.locationData.google_photo_url = response.location.google_photo_url || undefined;
                this.locationData.admin_verified = response.location.admin_verified;
                this.locationData.parent = response.parent;
                if (response.location.parent_id === -1) {
                    this.isHome = true;
                }
                this.locationData.parent_id =  this.encryptDecrypt.encrypt(response.location.parent_id).toString();

                for (let i = 0; i < this.locationData['sublocations'].length; i++) {
                    this.locationData['sublocations'][i]['location_id']
                    = this.encryptDecrypt.encrypt(this.locationData['sublocations'][i].location_id).toString();
                }
            });
          }else if( msg.getbreadcrumbs ){
            this.messageService.sendMessage({ 'breadcrumbs' : this.breadCrumbs });
          }
        });
    }

    ngOnChanges() {
    }

    getLocationData(callBack){
        this.loc_sub = this.locationService.getById(this.locationID, (response) => {
            if ('location' in response === false) {
                // this.router.navigate(['/location', 'list']);
            }

            this.locationData.name = response.location.name;
            this.locationData.location_id = response.locationID;
            this.locationData.is_building = response.location.is_building;
            this.locationData.formatted_address = response.location.formatted_address;
            this.locationData.sublocations = response.sublocations;
            this.locationData.google_photo_url = response.location.google_photo_url || undefined;
            this.locationData.admin_verified = response.location.admin_verified;
            this.locationData.parent = response.parent;
            if (response.location.parent_id === -1) {
                this.isHome = true;
            }
            this.locationData.parent_id =  this.encryptDecrypt.encrypt(response.location.parent_id);

            for (let i = 0; i < this.locationData['sublocations'].length; i++) {
                this.locationData['sublocations'][i]['location_id']
                = this.encryptDecrypt.encrypt(this.locationData['sublocations'][i].location_id);
            }

            this.toEditLocations = JSON.parse(JSON.stringify(this.locationData));
            this.toEditLocationsBackup = JSON.parse(JSON.stringify(this.locationData));

            this.complianceService.getLocationsLatestCompliance(this.locationID, (response) => {
                this.donut.updateDonutChart('#specificChart', response.percent, true);
                let nom = 0, denom = 0;
                for(let com of response.data){
                    if(com.compliance_kpis_id != 13){
                        if(com.valid == 1){
                            nom++;
                        }
                        denom++;
                    }
                }
                $('.manage-compliance .completion .start.number').html(nom);
                $('.manage-compliance .completion .end.number').html(denom);
            });

            this.breadCrumbs = [];
            this.breadCrumbs.push({
              'value' : 'Location list', 'link' : '/location/list'
            });
            for(let i in response.ancestries){

                if( response.ancestries[i].parent_is_building == 1 || response.ancestries[i].has_child_building == 1 || response.ancestries[i].is_building == 1 ){
                    let
                    queryParams = {},
                    encId =  this.encryptDecrypt.encrypt(response.ancestries[i]['location_id']),
                    url = (response.ancestries[i].is_building == 1) ? '/location/view/'+encId : '/location/list' ;

                    if( response.ancestries[i].has_child_building == 1  ){
                        queryParams['undrlocid'] = encId;
                    }

                    this.breadCrumbs.push({
                      'value' : response.ancestries[i].name, 'link' : url, 'queryParams' : queryParams
                    });
                }

            }
             
            this.messageService.sendMessage({ 'breadcrumbs' : this.breadCrumbs });
            callBack();
        }, { get_related_only : true });
    }

    ngOnInit() {
        $('.modal').modal({ dismissible: false });

        this.sub = this.route.params.subscribe((params) => {
            this.encryptedID = params['encrypted'];
            this.locationID = this.encryptDecrypt.decrypt(this.encryptedID);
            if ((this.locationID * 1) === -1) {
                this.router.navigate(['/location', 'list']);
            } else {
                this.preloaderService.show();
                this.getLocationData(() => {
                    setTimeout(() => {
                        this.preloaderService.hide();
                    }, 250);
                });

                this.complianceService.getLocationsLatestCompliance(this.locationID, (compResponse) => {
                    this.showLoadingCompliance = false;

                    this.donut.updateDonutChart('#specificChart', compResponse.percent, true);
                    let start = 0, end = 0;
                    for(let d of compResponse.data){
                        if(d.compliance_kpis_id != 13){
                            if(d.valid == 1){
                                start += 1;
                            }

                            end++;
                        }
                    }

                    $('.completion .start.number').html(start);
                    $('.completion .end.number').html(end);
                });
            }

        });

        this.locationService.getSublocationsOfParent(this.locationID)
        .subscribe((response) => {
            this.locationsSublocations = response.data;
            this.sameSublocationCopy = JSON.parse( JSON.stringify(this.locationsSublocations) );
        });

        let formAddTenant = this.formAddTenant;
        $('body').off('change.locationchange').on('change.locationchange', 'select.location-id', (event) => {
            formAddTenant.controls.location_id.setValue( event.currentTarget.value );
        });
	  }

    addNewSubLocationSubmit(form, e) {
        if(form.valid){
            this.errorMessageModalSublocation = '';
            this.showLoaderModalSublocation = true;
            if(Object.keys(this.selectedSubLocationFromModal).length > 0){
                this.locationService.assignSublocations([this.selectedSubLocationFromModal['location_id']])
                .subscribe((response) => {
                    this.loc_sub = this.locationService.getById(this.locationID, (response) => {
                        this.locationData.sublocations = response.sublocations;
                        for (let i = 0; i < this.locationData['sublocations'].length; i++) {
                            this.locationData['sublocations'][i]['location_id']
                            = this.encryptDecrypt.encrypt(this.locationData['sublocations'][i].location_id);
                        }
                        this.inpSublocationNameTwoWayData = '';
                        this.showLoaderModalSublocation = false;
                        this.errorMessageModalSublocation = '';
                        $('#modalAddSublocation').modal('close');
                    }, { get_related_only : true });
                });
            }else{
                this.locationService.createSubLocation({
                    name : form.controls.name.value,
                    parent_id : this.locationID
                }).subscribe(
                    (response) => {
                        this.showLoaderModalSublocation = false;
                        this.errorMessageModalSublocation = '';

                        if ('sublocations' in this.locationData == false){
                            this.locationData['sublocations'] = [];
                        }

                        response.data['children'] = [];

                        response.data['location_id'] = this.encryptDecrypt.encrypt(response.data['location_id']);
                        this.locationData['sublocations'].push(response.data);
                        $('#modalAddSublocation').modal('close');
                    },
                    (msg) => {
                        this.showLoaderModalSublocation = false;
                        this.errorMessageModalSublocation = msg.error;
                        setTimeout(() => {
                            this.errorMessageModalSublocation = '';
                        }, 2000);
                    }
                );
            }

        }else{
            form.controls.name.markAsDirty();
        }
    }

    archiveClick(){
        if(this.selectedArchive.length > 0){
            this.modalArchive.loader = true;
            let locs = [];

            locs.push({
                location_id : this.encryptDecrypt.decrypt(this.selectedArchive['location_id']),
                archived : (!this.paramArchived) ? 1 : 0
            });

            this.locationService.archiveMultipleLocation({
                locations : locs
            }).subscribe(() => {
                this.getLocationData(() => {
                    this.modalArchive.loader = false;
                    $('#modalArchive').modal('close');
                });
            });
        }
    }

	ngAfterViewInit(){
        $('.nav-list-locations').addClass('active');
        $('.location-navigation .active').removeClass('active');
        $('.location-navigation .view-location').addClass('active');

        this.selectRowEvent();
    }

    showNewTenant(){
        /*
        this.formAddTenant.reset();
        this.formAddTenant.controls.billing_country.setValue( this.defaultCountry );
        this.formAddTenant.controls.time_zone.setValue( this.defaultTimeZone );
        */
        $('#modalAddNewTenant').modal('open');

        $('#modalAddNewTenant select').material_select();
    }

    selectRowEvent(){

        $('body').off('change.selectchangeevent').on('change.selectchangeevent', 'select.select-from-row', (e) => {
            e.preventDefault();
            let target = $(e.target),
                val = target.val();

            if(val.indexOf('view-') > -1){
                let locIdEnc = val.replace('view-', '');

                this.router.navigate(["/location/view/", locIdEnc]);
            }else if(val.indexOf('addtenants-') > -1){
                let locIdEnc = val.replace('addtenants-', '');
                for(let i in this.locationData.sublocations){
                    if(this.locationData.sublocations[i]['location_id'] == locIdEnc){
                        this.selectedLocation = this.locationData.sublocations[i];
                        this.showLoadingSublocations = true;
                        this.locationService.getSublocationsOfParent(this.encryptDecrypt.decrypt(locIdEnc)).subscribe((subResponse) => {
                            this.selectedLocation['sublocations'] = [];
                            let copy = JSON.parse(JSON.stringify( this.selectedLocation ));
                            copy['location_id'] = this.encryptDecrypt.decrypt(copy.location_id);
                            this.selectedLocation['sublocations'].push(copy);
                            if(subResponse.data.length > 0){
                                this.selectedLocation['sublocations'] = this.selectedLocation['sublocations'].concat(subResponse.data);
                            }
                            this.showLoadingSublocations = false;
                            setTimeout(() => {
                                $('#modalAddNewTenant select.location-id').material_select();
                            }, 300);
                        });
                    }
                }
                this.showNewTenant();
            }else if(val.indexOf('viewsub-') > -1){
                let locIdEnc = val.replace('viewsub-', '');

                this.router.navigate(["/location/view-sublocation/", locIdEnc]);
            }else if(val.indexOf('benchmark-') > -1) {
                this.locationToApplyActionTo = this.encryptDecrypt.decrypt(val.replace('benchmark-', ''));
                $('#modalWardenBenchmarkCalc').modal('open');
                console.log(' Benchmark location id ' + this.locationToApplyActionTo);
            }else if(val.indexOf("archive-") > -1){
                let locIdEnc = val.replace('archive-', '');

                for(let i in this.locationData.sublocations){
                    if(this.locationData.sublocations[i]['location_id'] == locIdEnc){
                        this.selectedArchive = this.locationData.sublocations[i];
                        this.selectedArchive.length = 1;
                        $('#modalArchive').modal('open');
                    }
                }

            }

            target.val(0);
            target.material_select();
        });
    }

    submitNewTenant(formAddTenant:NgForm){
        if(formAddTenant.valid){
            this.showModalNewTenantLoader = true;

           formAddTenant.controls.location_id.setValue( $('#modalAddNewTenant select.location-id').val() );
            this.userService.sendTRPInvitation(formAddTenant.value).subscribe(() => {
                this.getLocationData(() => {

                    this.showModalNewTenantLoader = false;
                    $('#modalAddNewTenant').modal('close');
                    this.formAddTenant.reset();

                    setTimeout(() => {
                        this.preloaderService.hide();
                    }, 250);
                });

                this.complianceService.getLocationsLatestCompliance(this.locationID, (compResponse) => {
                    this.showLoadingCompliance = false;

                    this.donut.updateDonutChart('#specificChart', compResponse.percent, true);
                    let start = 0, end = 0;
                    for(let d of compResponse.data){
                        if(d.compliance_kpis_id != 13){
                            if(d.valid == 1){
                                start += 1;
                            }

                            end++;
                        }
                    }

                    $('.completion .start.number').html(start);
                    $('.completion .end.number').html(end);
                });

               
            }, (e) => {
              this.showModalNewTenantLoader = false;
              $('#modalAddNewTenant').modal('close');
              console.log(e);
              const errorObject = JSON.parse(e.error);
              alert(errorObject.message);
            });

        }
    }


    onKeyUpTypeSublocation(value){
        let trimmed = value.trim(),
        trimmedLow = trimmed.toLowerCase(),
        results = [];
        if(trimmed.length == 0){
            this.sameSublocation = [];
        }else{
            let searchChild = (children) => {
              for(let i in children){
                let name = children[i]['name'],
                  low = name.toLowerCase();

                if(low.indexOf(trimmedLow) > -1){
                  results.push( JSON.parse(JSON.stringify(children[i])) );
                }
              }
            };

            searchChild(this.sameSublocationCopy);
            this.sameSublocation = results;
        }
    }

    selectAddNewSubResult(sub, selectElement){
        $('.select-sub.red-text').removeClass('red-text').addClass('blue-text').html('select');
        if($(selectElement).hasClass('blue-text')){
          $(selectElement).removeClass('blue-text').addClass('red-text').html('selected');
        }else{
          $(selectElement).removeClass('red-text').addClass('blue-text').html('select');
        }
        $(this.inputSublocation.nativeElement).trigger('focusin');
        this.inpSublocationNameTwoWayData = sub.name;
        this.selectedSubLocationFromModal = sub;
    }

    cancelEditLocation(formEditLocation){
        formEditLocation.reset();
    }

    clickEditDetails(){
        this.toEditLocations = JSON.parse(JSON.stringify(this.toEditLocationsBackup));
        $('#modalEditDetails').modal('open');
        setTimeout(() => {
            Materialize.updateTextFields();
        }, 200);
    }

    submitEditLocation(formEditLocation:NgForm){
        if(formEditLocation.valid){
            let formData = {
                location : {
                    location_id : this.locationID,
                    name : formEditLocation.controls.name.value
                },
                sublocations : []
            };

            for(let i in this.toEditLocations['sublocations']){
                let data = {
                    name : this.toEditLocations['sublocations'][i]['name'], location_id : 0
                };
                if('location_id' in this.toEditLocations['sublocations'][i]){
                    data.location_id = this.encryptDecrypt.decrypt( this.toEditLocations['sublocations'][i]['location_id'] );
                }

                formData.sublocations.push(data);
            }

            this.showModalEditLoader = true;

            this.locationService.updateLocation(formData).subscribe((response) => {
                this.getLocationData(() => {
                    this.showModalEditLoader = false;
                    $('#modalEditDetails').modal('close');
                });
            });
        }
    }

    addSublocation(){
        let num = this.toEditLocations['sublocations'].length + 1;
        this.toEditLocations['sublocations'].push({
            name : 'Level '+ num
        });
        setTimeout(() => {
            Materialize.updateTextFields();
        }, 200);
    }

	ngOnDestroy() {

        if(typeof this.sub == 'object' && this.sub['unsubsribe']){
            this.sub.unsubsribe();
        }

        if(typeof this.loc_sub == 'object' && this.loc_sub['unsubsribe']){
            this.loc_sub.unsubsribe();
        }


       this.mutationOversable.disconnect();
    }



}
