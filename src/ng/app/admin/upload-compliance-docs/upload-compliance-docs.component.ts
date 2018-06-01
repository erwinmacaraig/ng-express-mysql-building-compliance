import { Component, AfterViewInit, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { HttpClient, HttpRequest, HttpResponse, HttpEvent } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';

@Component({
  selector: 'app-admin-compliance-doc-upload',
  templateUrl: './upload-compliance-docs.component.html',
  styleUrls: ['./upload-compliance-docs.component.css']
})

export class UploadComplianceDocComponent implements OnInit, AfterViewInit {
  title = 'This is a simple upload.';
  accept = '*';
  files: File[] = [];
  progress: number;
  url = 'https://evening-anchorage-3159.herokuapp.com/api/';
  hasBaseDropZoneOver: boolean = false;
  httpEmitter: Subscription;
  // httpEvent: HttpEvent<Event>;
  httpEvent: any;
  lastFileAt: Date;
  private baseUrl: String;
  sendableFormData: FormData;

  constructor(public http: HttpClient, platformLocation: PlatformLocation) {
    this.baseUrl = (platformLocation as any).location.origin;
  }

  ngOnInit() {}

  ngAfterViewInit() {

  }
  cancel(){
    this.progress = 0;
    if( this.httpEmitter ) {
      console.log('cancelled')
      this.httpEmitter.unsubscribe()
    }
  }

  uploadFiles(files: File[]): Subscription {
    this.sendableFormData.append('account_id', '5');
    this.sendableFormData.append('building_id', '62');
    this.sendableFormData.append('compliance_kpis_id', '2');
    this.sendableFormData.append('viewable_by_trp', '1');

    this.sendableFormData.append('date_of_activity', '2018-06-01');
    this.sendableFormData.append('description', 'Manual Entry');
    const req = new HttpRequest<FormData>('POST', `${this.baseUrl}/admin/upload/compliance-documents/`, this.sendableFormData, {
      reportProgress: true
    });

    return this.httpEmitter = this.http.request(req)
    .subscribe(
      event => {
        this.httpEvent = event;

        if (event instanceof HttpResponse) {
          delete this.httpEmitter;
          console.log('request done', event);
        }
      },
      error => console.log('Error Uploading', error)
    );
  }
  getDate() {
    return new Date();
  }
}
