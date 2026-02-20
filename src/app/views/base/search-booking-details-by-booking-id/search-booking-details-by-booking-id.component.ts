import { Component, OnInit, NgModule } from '@angular/core';
import { NgTemplateOutlet, CommonModule, DatePipe} from '@angular/common';
import { Validators, FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule, RouterLink } from '@angular/router';
import { HTTP_INTERCEPTORS} from '@angular/common/http';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { APiProperties } from '../../../../app/class/api-properties';
import { ShowBookingDetailsByIdComponent } from '../../base/show-booking-details-by-id/show-booking-details-by-id.component';

@Component({
  selector: 'app-search-booking-details-by-booking-id',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink, CommonModule, FormsModule, ReactiveFormsModule, ShowBookingDetailsByIdComponent ],
  templateUrl: './search-booking-details-by-booking-id.component.html',
  styleUrl: './search-booking-details-by-booking-id.component.scss'
})
export class SearchBookingDetailsByBookingIdComponent {

  apiProperties : APiProperties = new APiProperties();

  baseUrl: any;
  constructor(private fb: FormBuilder) { 
    const currentUrl = window.location.href;
    const url = new URL(currentUrl);
    this.baseUrl = url.origin + url.pathname + '#/';
  }
  
  submitted = false;
  bookingIdSearchFormBlk = false;
  showBookingDetails = false;
  ngOnInit(): void {
    this.bookingIdSearchFormBlk = true;
    this.showBookingDetails = false;
  }

  searchForm = this.fb.group({
    bookingId : ['', Validators.required]
  });
  get f(){
    return this.searchForm.controls;
  }

  keyPressForNumber(event: any) {
    const pattern = /[0-9]/;
    let inputChar = String.fromCharCode(event.charCode);
    if (event.keyCode != 8 && !pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  searchBookingDetails(){
    this.submitted = true;  
    if(this.searchForm.invalid) {
      return;
    }

    var userRole =localStorage.getItem('userRole');
    const data = JSON.parse(localStorage.getItem(userRole+"-loginDetails"));
    
    if(data == null){
      return;
    }

    if(data.accessToken == null){
      return;
    }

    this.bookingInfoByIdShow();
  }

  displayBookingId: any;
  bookingInfoByIdShow(){
    this.submitted = false;
    this.showBookingDetails = true;
    this.bookingIdSearchFormBlk = false;
    this.displayBookingId = this.searchForm.get("bookingId").value;
    console.log(this.displayBookingId);
   // window.open(this.baseUrl+'showBookingDetails/'+this.displayBookingId, '_blank');
  }

  bookingInfoByIdHide(){
    this.bookingIdSearchFormBlk = true;
    this.showBookingDetails = false;
  }

}