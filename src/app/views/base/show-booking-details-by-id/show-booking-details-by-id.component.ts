import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgTemplateOutlet, CommonModule, DatePipe} from '@angular/common';
import { FormsModule, ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule, RouterLink } from '@angular/router';
import { APiProperties } from '../../../../app/class/api-properties';
import { OnewayNodeService } from '../../../../app/service/oneway-node.service';
import { OnewayPartnerEnrolApiService } from '../../../service/oneway-partner-enrol-api.service';
import { OnewayWebApiService } from '../../../service/oneway-web-api.service';
import { RemoveBrPipe } from '../../../pipes/remove-br.pipe';
import { ReplaceArrowPipe } from '../../../pipes/replace-arrow.pipe';

@Component({
  selector: 'app-show-booking-details-by-id',
  standalone: true,
  imports: [NgTemplateOutlet, CommonModule, FormsModule, ReactiveFormsModule, ShowBookingDetailsByIdComponent, RemoveBrPipe, ReplaceArrowPipe ],
  templateUrl: './show-booking-details-by-id.component.html',
  styleUrl: './show-booking-details-by-id.component.scss'
})
export class ShowBookingDetailsByIdComponent implements OnInit {
  apiProperties : APiProperties = new APiProperties();
  @Input() displayBookingId!: any;

  constructor(private fb: FormBuilder, 
    private ons: OnewayNodeService,
    private opeas: OnewayPartnerEnrolApiService,
    private owas: OnewayWebApiService,
    private router: Router) { }

  
  resendDDBtn = true;  
  bookingDetails = true;
  customerDetails = false;
  driverDetails = false;
  paymentDetails = false;
  viewCon = false;
  viewBtn = true;  
  ngOnInit(): void {

      this.resendDDBtn = true;  
      this.bookingDetails = true;
      this.customerDetails = false;
      this.driverDetails = false;
      this.paymentDetails = false;
  
      this.getBookingDetails();
  
      this.viewCon = false;
      this.viewBtn = true;
  }

  showBookingDetailsByIdHead = true;
  showBookingDetailsByIdBlk = false;
  isHide = true;
  isHideTracking = true;
  abundant = false;
  advancePaymentBtn = false;
  airportPlusToll = false;
  interstatePlusToll = false;
  driverPaidCondition: any;
  responseData : any =[];
  aiportEntryChargeDisplay: any;
  interStateChargeDisplay: any;
  tolltaxChargeDisplay: any;
  bookId : any;
  getBookingDetails(){
    const requestData = {
      clientId : this.apiProperties.clientId,
      clientSecret : this.apiProperties.clientSecret,
      displayBookingId : this.displayBookingId
    };
    console.log(requestData);

    var userRole =localStorage.getItem('userRole');
    const data = JSON.parse(localStorage.getItem(userRole+"-loginDetails"));
    
    if(data == null){
      return;
    }

    if(data.accessToken == null){
      return;
    }

    this.ons.getBookingDetailsByDisplayBookingId(JSON.stringify(requestData), data.accessToken).subscribe((data : {})=>{
      this.responseData = data
      //console.log("Booking Info By Id Response :", JSON.stringify(this.responseData));
      
      if(this.responseData.status ==1){

        this.showBookingDetailsByIdHead = true;
        this.showBookingDetailsByIdBlk = true;

        this.driverPaidCondition = this.responseData.list[0].cashAmount;
        
        if(this.responseData.list[0].trip_type=="Outstation"){
          this.responseData.list[0].trip_type="Outstation (Round Trip)";
          this.responseData.list[0].trip_type_main="Outstation";
        }

        if(this.responseData.list[0].bookStatus=='Cancelled'){
            this.isHide = false;
            this.isHideTracking = false;
            this.resendDDBtn = false;
        }else if(this.responseData.list[0].bookStatus=='Completed'){
            this.isHide = false;
            this.resendDDBtn = false;
        }

        if(this.responseData.list[0].bookStatus=='Pending assignment'){
          this.resendDDBtn = false;
          this.isHideTracking = false;
        }

        if(this.responseData.list[0].bookStatus=='Assigned' || 
           this.responseData.list[0].bookStatus=='Manual assigned by admin' || 
           this.responseData.list[0].bookStatus=='Arrived at customer location' || 
           this.responseData.list[0].bookStatus=='Going to customer location' ||
           this.responseData.list[0].bookStatus=='Journey started'){
          this.isHide = false;
        }

        if(this.responseData.list[0].paymentType == null || this.responseData.list[0].paymentType== 0){
          this.abundant = true;
        }

        if(this.responseData.list[0].cashAmount > 0){
          this.advancePaymentBtn = true;
        }

        if(this.responseData.list[0].hasOwnProperty('aiportEntryCharge')) {
          //console.log('aiportEntryCharge is present in the JSON response');
          this.aiportEntryChargeDisplay = this.responseData.list[0].aiportEntryCharge;
        } else {
          console.log('aiportEntryCharge not present');
        }

        if(this.responseData.list[0].hasOwnProperty('interStateCharge')) {
          this.interStateChargeDisplay = this.responseData.list[0].interStateCharge;
          console.log('interStateCharge is present in the JSON response');
        } else {
          console.log('interStateCharge not present');
        }

        if(this.responseData.list[0].hasOwnProperty('tolltaxCharge')) {
          console.log('tolltaxCharge is present in the JSON response');
          this.tolltaxChargeDisplay = this.responseData.list[0].tolltaxCharge;
        } else {
          console.log('tolltaxCharge not present');
        }

        if(this.aiportEntryChargeDisplay > 0 && this.tolltaxChargeDisplay > 0){
          this.airportPlusToll = true;
        } else {
          this.airportPlusToll = false;
        }

        if(this.interStateChargeDisplay > 0 && this.tolltaxChargeDisplay > 0){
          this.interstatePlusToll = true;
        } else {
          this.interstatePlusToll = false;
        }

        this.bookId = this.responseData.list[0].book_id;
        this.fetchDriverDetailsOfBooking(this.responseData.list[0].book_id);
        this.fetchDriverAndCabImages(this.responseData.list[0].book_id);
      
      } else {
          
        this.showBookingDetailsByIdHead = true;
        let displayBookingId = this.displayBookingId;
        
      }

    },error =>{
      console.log("getBookingDetails By booking id error :",error);
    });

  }

  vendorDetailDisplay = false;
  dcoAlternerNumAvailable = false;
  driverDetailsOfBookingRes: any=[];
  fetchDriverDetailsOfBooking(book_id: any){

    const requestData = {
      bookingId : book_id
    };

    var userRole =localStorage.getItem('userRole');
    const data = JSON.parse(localStorage.getItem(userRole+"-loginDetails"));
    
    if(data == null){
          return;
    }

    if(data.accessToken == null){
        return;
    }

    this.ons.getDriverDetailsOfBooking(JSON.stringify(requestData), data.accessToken).subscribe((data : {})=>{
      this.driverDetailsOfBookingRes = data;
      console.log(this.driverDetailsOfBookingRes);

      if(this.driverDetailsOfBookingRes.details?.vendorName != ""){
        this.vendorDetailDisplay = true;
      }

      if(this.driverDetailsOfBookingRes.status == "1"){
        this.dcoAlternerNumAvailable = true;
        this.fetchAlternateNumbers(this.driverDetailsOfBookingRes.details.driverPrimaryMobileNumber);
      }
  
    },error =>{
      console.log("getBookingDetails By booking id error :",error);
    });

  }

  alternetNumberYes = false;
  alternetNumberNo = false;
  alternateNumbersRes: any=[];
  fetchAlternateNumbers(blkDetail: any) {
    
    const requestData = {
      dcoInputMethod : "mobileNumber",
      dcoInputValue : blkDetail
    };
    console.log(requestData);

    this.opeas.getAlternateNumbers(JSON.stringify(requestData)).subscribe((data:{}) => {
      this.alternateNumbersRes = data;
      console.log(this.alternateNumbersRes);
      
      if(this.alternateNumbersRes.status == 1){
        this.alternetNumberYes = true;
        this.alternetNumberNo = false;
      } else {
        this.alternetNumberYes = false;
        this.alternetNumberNo = true;
      }

    },error =>{
      //console.log("Error: "+error);
    });

  }

  webAccessKeyRes: any=[];
  driverAndCabImagesRes: any=[];
  fetchDriverAndCabImages(book_id: any){
    
    const requestData = {
      companyName : this.apiProperties.webCompanyName,
      clientID : this.apiProperties.webClientID,
      clientSecret : this.apiProperties.webClientSecret
    };
    
    this.owas.getAccessKeyWeb(JSON.stringify(requestData)).subscribe((data : {})=>{
      this.webAccessKeyRes = data;
      //console.log(this.webAccessKeyRes);
      
      const requestDCImagesData = { 
        userName : this.apiProperties.webCompanyName,
        accessKey : this.webAccessKeyRes.accessKey,
        bookId: book_id
      }
      //console.log(this.requestDCImagesData);
        
          this.owas.getDriverAndCabImages(JSON.stringify(requestDCImagesData)).subscribe((data : {})=>{
            this.driverAndCabImagesRes = data;
             //console.log(this.driverAndCabImagesRes);
            
          },error =>{
            console.log("getDriverAndCabImages error :",error);
          });

    },error =>{
      console.log("getAccessKeyWeb error :",error);
    });
  }

  copyCardContent(cardId: string): void {
    const cardElement = document.getElementById(cardId);
    if (cardElement) {
      const textToCopy = cardElement.innerText || cardElement.textContent;
      navigator.clipboard.writeText(textToCopy).then(
        () => {
          alert('Card content copied!');
        },
        (err) => {
          console.error('Failed to copy content: ', err);
        }
      );
    }
  }

  @Output('bookingInfoByIdHide') bookingInfoByIdHide = new EventEmitter();
  back(){
    this.bookingInfoByIdHide.emit();
  }
}