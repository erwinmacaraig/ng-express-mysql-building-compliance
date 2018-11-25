import { Component } from '@angular/core';
import { OnInit, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
    selector: 'app-notified-trp-required-training',
    templateUrl: './notified-trp-training.component.html',
    styleUrls: ['./notified-trp-training.component.css']
})
export class NotifiedTRPTrainingsComponent {

    // private properties

    // public properties
    public isCompliant = false;
    public emergencyRoles = [];
    public trainingItems = []; // required training items
    public validTrainingItems = []; 


    constructor() {}


    ngOnInit() {}

    ngAfterViewInit() {}


    ngOnDestroy() {}


    




}