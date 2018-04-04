import {  NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SetupLocationComponent } from './setup-location/setup-location.component';

import { ReactiveFormsModule } from '@angular/forms';
import { AgmCoreModule } from '@agm/core';

@NgModule({
  declarations: [
    // SetupLocationComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule
  ]
})
export class LocationModule {}
