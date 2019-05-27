import { Component, OnInit, AfterViewInit, ElementRef, OnDestroy } from '@angular/core';
import { PersonInfoResolver } from '../../services/person-info.resolver';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../../environments/environment';
import { Person } from '../../models/person.model';
import { ActivatedRoute} from '@angular/router';
import { ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';


import { MessageService } from '../../services/messaging.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/users';
import { Subscription } from 'rxjs/Subscription';

declare var $: any;

@Component({
  selector: 'app-person-info',
  templateUrl: './person-info.component.html',
  styleUrls: ['./person-info.component.css'],
  providers: [DashboardPreloaderService, UserService]
})
export class PersonInfoComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('f') personInfoForm: NgForm;
  @ViewChild('myPhoto') myPhoto: ElementRef;
  

  public person;
  public accountTypes;
  editCtrl = true;
  private baseUrl;
  public message;
  emailBlackListed = false;
  emailTaken = false;
  public usersImageURL: String = 'assets/images/camera_upload_hover.png';
  public hasUserImage: boolean = false;
  private userId = 0;
  private mySub: Subscription;
  private myRouteQuerysub: Subscription;

  constructor(private route: ActivatedRoute,
              private http: HttpClient,
              private preloaderService: DashboardPreloaderService,
              private messageService: MessageService,
              private authService: AuthService,
              private userService: UserService) {

    this.baseUrl = environment.backendUrl;    
    this.preloaderService.show();
  }

  ngOnInit() {
      this.userId = this.authService.userDataItem('userId');
      $('.modal').modal({
        dismissible: false,
        endingTop: '25%',
        opacity: 0.7
      });
      
      if(this.authService.userDataItem('profilePic').length > 5){
          this.usersImageURL = this.authService.userDataItem('profilePic');
          this.hasUserImage = true;
      }

      this.route.data.subscribe(data => {
         this.person = new Person(data.personInfo.first_name,
          data.personInfo.last_name,
          data.personInfo.email,
          data.personInfo.phone_number,
          data.personInfo.occupation,
          data.personInfo.account_name,
          data.personInfo.user_name);
      }, (err: HttpErrorResponse) => {
        if (err.error instanceof Error) {
          alert('There was a problem getting your account.');
        } else {
            alert(`Backend returned code ${err.status}, body was: ${err.error}`);
            console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
        }
      }
    ); // end of subscribe

    this.mySub = this.messageService.getMessage().subscribe((message) => {      
      if (message.profilePic) {
        this.hasUserImage = true;
        this.usersImageURL = message.profilePic;
      }
      /*
      if (message.edit_person_info) {        
        this.editCtrl = message.edit_person_info;
      }
      */
    });

  }
  onSumbitModifyPersonInfo(f: NgForm) {
    const header = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    this.emailBlackListed = false;
    this.emailTaken = false;

    this.http.patch(this.baseUrl + '/update-person-info', {
      'first_name': f.value.first_name,
      'last_name': f.value.last_name,
      'occupation': f.value.occupation,
      'email': f.value.email,
      'phone_number': f.value.phone_number
    }, {
      headers: header
    }).subscribe(data => {
      this.person.first_name = f.value.first_name;
      this.person.last_name = f.value.last_name;
      this.person.email = f.value.email;
      this.person.phone_number = f.value.phone_number;
      this.person.occupation = f.value.occupation;
      $('#modal-edit-confirmation').modal('open');
      this.messageService.sendMessage({
        'person_first_name': f.value.first_name,
        'person_last_name': f.value.last_name
      });

      // update local storage
      const userData = this.authService.getUserData();
      
      userData['name'] = f.value.first_name + ' ' + f.value.last_name;
      this.authService.setUserData(userData);

      this.onResetForm();
      
      }, (err: HttpErrorResponse) => {
          const parsedErrorMessage = JSON.parse(err.error);
          if (err.error instanceof Error) {
            // alert('There was a problem with the udpate query.');
          } else {
              if(parsedErrorMessage.message == 'Email taken'){
                this.emailTaken = true;
              }else if(parsedErrorMessage.message == 'Domain blacklisted'){
                this.emailBlackListed = true;
              }else{
                // alert(`Backend returned code ${err.status}, body was: ${err.error}`);
                console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
              }
          }
      } // end HttpErrorResponse
    );
   } // emd onSubmitModifyPersonInfo

  onResetForm() {
    // this.editCtrl = false;
    this.editCtrl = true;
    this.personInfoForm.resetForm(this.person);
    this.emailBlackListed = false;
  }

  ngAfterViewInit() {
    
    // $('select').prop('disabled', false).material_select();
    if (!$('.vertical-m').hasClass('fadeInRight')) {
      $('.vertical-m').addClass('fadeInRight animated');
    }

    this.preloaderService.hide();
  }

  filterUrl(url:String){
    return url.replace('unsafe:', '').trim();
  }

  uploaderClick() {
    this.myPhoto.nativeElement.click();
  }

  onPhotoSelected() {
    this.preloaderService.show();
    let
        file = this.myPhoto.nativeElement.files[0],
        formData = new FormData();
        formData.append('user_id', this.userId.toString());
        formData.append('file', file, file.name);
        this.userService.uploadProfilePicture(formData).subscribe((response) => {
          this.hasUserImage = true;
          this.usersImageURL = response['data']['url'];          
          // updpate localStorage
          this.authService.setUserDataItem('profilePic', this.usersImageURL);
          // send throughout the application
          this.messageService.sendMessage({'profilePic': this.usersImageURL});

          this.preloaderService.hide();
        }, (error) => {
          this.preloaderService.hide();
        });

  }

  ngOnDestroy() {
    this.mySub.unsubscribe();
  }





}
