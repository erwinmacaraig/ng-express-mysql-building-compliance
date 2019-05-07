import { Component } from "@angular/core";
import { OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { UserService } from '../../services/users';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'app-stay-go',
    templateUrl: './stay_go.component.html',
    styleUrls: ['./stay_go.component.css'],
    providers: [UserService]
})
export class StayAndGoComponent implements OnInit, AfterViewInit, OnDestroy {

    private mySub:Subscription;
    constructor(private route: ActivatedRoute, private userService: UserService) {

    }
    
    ngOnInit() {

    }

    ngAfterViewInit() {

    }

    ngOnDestroy() {
        if (this.mySub) {
            this.mySub.unsubscribe();
        }
    }

    emailInfoGraphic() {
        this.mySub = this.userService.sendInfoGraphic().subscribe((response) => {
            console.log('Success');
        }, (error) => {
            alert('Error sending email. Try again later.');
        });
    }

}