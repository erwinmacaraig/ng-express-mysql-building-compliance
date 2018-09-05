import { Component, OnInit } from '@angular/core';
import { Alert, AlertType } from '../models/alert';
import { AlertService } from '../services/alert.service';

@Component({
    moduleId: module.id,
    selector: 'app-alert',
    templateUrl: './alert.component.html',
    styleUrls: ['./alert.component.css']
})
export class AlertComponent implements OnInit {
    alerts: Alert[] = [];

    constructor(private alertService: AlertService) { }

    ngOnInit() {
        this.alertService.getAlert().subscribe((alert: Alert) => {
            if(!alert){ return false; }
            if (!alert.message) {
                // clear alerts when an empty alert is received
                this.alerts = [];
                return;
            }

            // add alert to array
            this.alerts.push(alert);
        });
    }

    removeAlert(alert: Alert) {
        this.alerts = this.alerts.filter(x => x !== alert);
    }

    cssClass(alert: Alert) {
        if (!alert) {
            return;
        }

        // return css class based on alert type
        switch (alert.type) {
            case AlertType.Success:
                return 'materialert success';
            case AlertType.Error:
                // return 'alert alert-danger';
                return 'materialert error'
            case AlertType.Info:
                return 'materialert info';
            case AlertType.Warning:
                return 'materialert warning';
        }
    }
    materialIcons(alert: Alert) {
        switch (alert.type) {
            case AlertType.Success:
                return 'check';
            case AlertType.Error:
                return 'error_outline'
            case AlertType.Info:
                return 'info_outline';
            case AlertType.Warning:
                return 'warning';
        }
    }
}
