import { Component } from '@angular/core';
import { OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/users';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { CourseService } from '../../services/course';
@Component({
    selector: 'app-notified-trp-required-training',
    templateUrl: './notified-trp-training.component.html',
    styleUrls: ['./notified-trp-training.component.css'],
    providers: [UserService, EncryptDecryptService, CourseService]
})
export class NotifiedTRPTrainingsComponent implements OnInit, AfterViewInit, OnDestroy{

    // private properties
    private userId = 0;
    private location_id = 0;
    private configId = 0;
    private notification_token_id = 0;
    private role = 0;
    private accountId = 0;
    private building_id = 0;
    
    // public properties
    public isCompliant = false;
    public emergencyRoles = [8]; // if user is tagged to a location, its automatic that user is gen occupant
    public trainingItems = []; // required training items
    public validTrainingItems = []; 
    public encryptedToken = '';
    public hasTrainingReminder = false;

    constructor(private userService: UserService,
        private route: ActivatedRoute,
        private router: Router,
        private cryptor: EncryptDecryptService,
        private authService: AuthService,
        private sanitizer: DomSanitizer,
        private courseService: CourseService) {}


    ngOnInit() {
        this.route.params.subscribe((params) => {
            const token = this.cryptor.decryptUrlParam(params['token']);
            this.encryptedToken = params['token'];
            const parts: Array<string> = token.split('_');
            this.userId = +parts[0];
            this.location_id = +parts[1];
            this.building_id = +parts[2];
            this.role = +parts[3];
            this.accountId = +parts[4];

            const userId = +this.authService.userDataItem('userId');
            if (isNaN(this.building_id) ||
                isNaN(this.userId) ||
                isNaN(this.location_id) ||
                isNaN(this.role) ||
                isNaN(this.accountId) ||
                userId != this.userId
                ) {
                this.authService.removeToken();
                this.router.navigate(['/success-valiadation'],
                { queryParams: { 'verify-notified-user': 0}});
            }
        });
        for (let role of this.authService.userDataItem('roles')) {
            if (role['role_id'] > 2) {
                this.emergencyRoles.push(role['role_id']);
            }
        }
        this.userService.getTrainingData(this.userId, this.emergencyRoles)
        .subscribe((res) => {
            console.log(res);
            if (res.invalid_trainings.length == 0 &&
               res.valid_trainings.length == res.required_trainings.length) {
                    this.isCompliant = true;
            }



            this.trainingItems = [...res.valid_trainings, ...res.invalid_trainings];

            
        });
        



    }

    ngAfterViewInit() {}


    ngOnDestroy() {}


    




}