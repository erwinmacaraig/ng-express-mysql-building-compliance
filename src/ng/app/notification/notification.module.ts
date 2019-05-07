import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';

import { AppRoutingModule } from '../app-routing.module';

import { NotificationListComponent } from './list/notification-list.component';
import { NotificationConfigurationComponent } from './configuration/notification-config.component';
import { NotifiedUsersListComponent } from './notified-users-list/notified-users-list.component';
import { NotificationQueryComponent } from './queries/notification-queries.component';
import { NotificationWardenListComponent } from './warden-list/warden-list.component';
import { NotificationPEEPListComponent } from './peep-list/peep-list.component';
import { WardenNotificationComponent } from './warden-notification/warden-notification';
import { SummaryViewComponent } from './summary-view/summary.view.component';
import { NotifiedTrpUpdateProfileComponent } from './notified-trp-update-profile/notified-trp-update-profile.component';
import { NotifiedTRPTrainingsComponent } from './notified-trp-training/notified-trp-training.component';



@NgModule({
    declarations: [
        NotificationListComponent,
        NotificationConfigurationComponent,
        NotifiedUsersListComponent,
        NotificationQueryComponent,
        NotificationWardenListComponent,
        NotificationPEEPListComponent,
        WardenNotificationComponent,
        NotifiedTrpUpdateProfileComponent,
        SummaryViewComponent,
        NotifiedTRPTrainingsComponent,
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        NgMultiSelectDropDownModule.forRoot(),
        FormsModule,
        AppRoutingModule,
    ]
})
export class NotificationModule {

}