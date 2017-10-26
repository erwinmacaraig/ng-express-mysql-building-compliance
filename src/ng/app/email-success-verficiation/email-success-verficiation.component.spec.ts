import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailSuccessVerficiationComponent } from './email-success-verficiation.component';

describe('EmailSuccessVerficiationComponent', () => {
  let component: EmailSuccessVerficiationComponent;
  let fixture: ComponentFixture<EmailSuccessVerficiationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmailSuccessVerficiationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmailSuccessVerficiationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
