import { Component, OnInit, AfterViewInit } from '@angular/core';

declare var $: any;
@Component({
  selector: 'app-signup-select-role',
  templateUrl: './select.role.component.html',
  styleUrls: ['./select.role.component.css']
})
export class SignupSelectRoleComponent implements OnInit, AfterViewInit {

  constructor() { }

  ngOnInit() {
  }

  ngAfterViewInit(){
      $('.modal-overlay').remove();
  }

}
