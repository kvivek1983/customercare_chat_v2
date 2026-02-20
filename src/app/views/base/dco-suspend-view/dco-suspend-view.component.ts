import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { NgTemplateOutlet, CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, Validators, FormGroup, FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule, RouterLink } from '@angular/router';
import { APiProperties } from '../../../../app/class/api-properties';
import { OnewayNodeService } from '../../../../app/service/oneway-node.service';
import { OnewayPartnerEnrolApiService } from '../../../service/oneway-partner-enrol-api.service';
import { OnewayWebApiService } from '../../../service/oneway-web-api.service';
import { RemoveBrPipe } from '../../../pipes/remove-br.pipe';
import { ReplaceArrowPipe } from '../../../pipes/replace-arrow.pipe';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-dco-suspend-view',
  standalone: true,
  imports: [NgTemplateOutlet, CommonModule, FormsModule, ReactiveFormsModule, RemoveBrPipe, ReplaceArrowPipe],
  templateUrl: './dco-suspend-view.component.html',
  styleUrl: './dco-suspend-view.component.scss'
})
export class DcoSuspendViewComponent {
  apiProperties: APiProperties = new APiProperties();
  @Input() chatNumber: any;
  @Input() selectedView: any;
  @Output() dcoSelected = new EventEmitter<any>();

  dcoStatusForm: FormGroup;

  constructor(private fb: FormBuilder,
    private ons: OnewayNodeService,
    private opeas: OnewayPartnerEnrolApiService,
    private owas: OnewayWebApiService,
    private router: Router,
    private toastr: ToastrService) {

      // Initialize the form
    this.dcoStatusForm = this.fb.group({
      tag: ["", Validators.required],
      subTag: ["", Validators.required],
      // followUpDateTime: [""]
    });

  }

  dcoNumber: any;
  agentNumber: any = null;
  ngOnInit(): void {
    console.log("New Chat Number :: " + this.chatNumber);
    this.dcoNumber = this.chatNumber;
    this.getPartner(this.dcoNumber);
    this.driverAllDetails(this.dcoNumber);

    //alert(this.selectedView);
    
    this.dcoTransactionHistoryTbl=false;

    const userRole = localStorage.getItem('userRole');
    if (userRole) {
      const rawData = localStorage.getItem(`${userRole}-loginDetails`);
      const data = rawData ? JSON.parse(rawData) : null;
      if (data && data.agentNumber) {
        this.agentNumber = data.agentNumber;
      }

      this.fetchAllTagsForFreelancer(this.dcoNumber);
      this.fetchMainTagsList();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chatNumber'] && !changes['chatNumber'].isFirstChange()) {
      console.log('Updated Chat Number :: ', this.chatNumber);
      // this.handleChatNumberChange(this.chatNumber);
      
      //alert(this.selectedView);

      this.dcoTransactionHistoryTbl=false;

      this.dcoNumber = this.chatNumber;
      this.getPartner(this.dcoNumber);
      this.driverAllDetails(this.dcoNumber);
      this.fetchAllTagsForFreelancer(this.dcoNumber);
    }
  }

  cabDetailSection: boolean = false;
  bankDetailSection: boolean = false;
  driverDetailSection: boolean = false;
  isOnboardingFeeBlk: boolean = false;
  getPartnerBlk: boolean = false;
  isOnboardingFeePaidNo: boolean = true;
  getPartnerResponse: any = [];
  getPartner(dcoNumber: any) {
    this.getPartnerResponse = [];

    this.cabDetailSection = false;
    this.bankDetailSection = false;
    this.driverDetailSection = false;
    this.isOnboardingFeeBlk = false;

    const requestData = {
      clientId: this.apiProperties.peaClientId,
      clientSecret: this.apiProperties.peaClientSecret,
      mobileNumber: dcoNumber
    };
    console.log(requestData);

    this.opeas.getPartner(JSON.stringify(requestData)).subscribe((data: {}) => {
      this.getPartnerResponse = data;
      console.log(this.getPartnerResponse);

      if (this.getPartnerResponse.status == 1) {
        this.getPartnerBlk = true;

        // Check if the keys are present
        const isBankDetailSectionInternalStatusPresent = 'bankDetailSectionInternalStatus' in this.getPartnerResponse;
        const isDriverDetailSectionInternalStatusPresent = 'driverDetailSectionInternalStatus' in this.getPartnerResponse;
        const isCabDetailSectionInternalStatusPresent = 'cabDetailSectionInternalStatus' in this.getPartnerResponse;
        const isOnboardingFeeBlkPresent = 'isOnboardingFeePaid' in this.getPartnerResponse;

        // const dcoId = this.getPartnerResponse.dcoId;
        // console.log(dcoId);

        if (isBankDetailSectionInternalStatusPresent) {
          this.bankDetailSection = true;
        }

        if (isDriverDetailSectionInternalStatusPresent) {
          this.driverDetailSection = true;
        } else {
          this.driverDetailSection = false;
        }

        if (isCabDetailSectionInternalStatusPresent) {
          this.cabDetailSection = true;
        }

        if (isOnboardingFeeBlkPresent) {
          this.isOnboardingFeeBlk = true;
        }

        if (this.getPartnerResponse.isOnboardingFeePaid == "No") {
          this.isOnboardingFeePaidNo = true;
        }

      } else {
        this.getPartnerBlk = false;
      }

    }, error => {
      //console.log("Error: "+error);
    });

  }

  statusText(status: number): string {
    switch (status) {
      case 0: return 'No Data';
      case 1: return 'Approved';
      case 2: return 'Not-Approved';
      case 3: return 'Pending Verification';
      default: return 'Unknown Status';
    }
  }

  getDcoDetailsBlk: boolean = false;
  driverIdPass: any;
  requestData: any = {};
  getDcoDetailsRes: any = [];
  driverAllDetails(dcoNumber: any) {
    var userRole = localStorage.getItem('userRole');
    //const data = JSON.parse(localStorage.getItem(userRole+"-loginDetails"));
    const storedData = localStorage.getItem(userRole + "-loginDetails");
    const data = storedData ? JSON.parse(storedData) : null;

    if (data == null) {
      return;
    }

    if (data.accessToken == null) {
      return;
    }

    this.requestData = {
      mobileNumber: dcoNumber
    };

    this.ons.getDcoDetails(JSON.stringify(this.requestData), data.accessToken).subscribe((data: {}) => {
      this.getDcoDetailsRes = data;
      //console.log(this.getDcoDetailsRes);

      if(this.getDcoDetailsRes.status == 1) {
        this.driverIdPass = this.getDcoDetailsRes.personal_details.driver_id;
        this.sendDcoName(this.getDcoDetailsRes.personal_details.driver_name);
        this.getDcoDetailsBlk = true;
        // this.displayDcoIdData = true;
        // this.driverPerformanceMatrix = false;
        // this.driverPerformanceForm.patchValue( {'driverPerformance':"lastTwoMonth"} );
        // this.dcoId = this.getDcoDetailsRes.personal_details.dco_id;

        // this.fetchLast10CompletedBookingDetailsOfDriverOrCustomer();

        // if(this.driverIdPass){
        //   this.getPartnerAnalyticsDashboard("lastTwoMonth");
        // }

        this.dcoTransactionHistory();

      } else {
        this.getDcoDetailsBlk = false;
        //alert(this.getDcoDetailsRes.message);
      }

    }, error => {
      //console.log("Error: "+error);
    });

  }

  //For Suspend DCO Only
  dcoTransactionHistoryTbl=false;
  dcoTransactionHistoryRes: any=[];
  dcoTransactionHistory(){

    var userRole = localStorage.getItem('userRole');

    // const data = JSON.parse(localStorage.getItem(userRole+"-loginDetails"));
    const storedData = localStorage.getItem(userRole + "-loginDetails");
    const data = storedData ? JSON.parse(storedData) : {};

    this.requestData = {
      clientId : this.apiProperties.clientId,
      clientSecret : this.apiProperties.clientSecret,
      driverId : this.driverIdPass
    };
    console.log(this.requestData);
    
    this.ons.dcoTransactionHistory(JSON.stringify(this.requestData)).subscribe((data:{})=>{
      this.dcoTransactionHistoryRes = data;
      console.log(this.dcoTransactionHistoryRes.status);

      if(this.dcoTransactionHistoryRes.status == 1){
        this.dcoTransactionHistoryTbl = true; 
      } else {
        this.dcoTransactionHistoryTbl = false;
      }
      
    },error=>console.log("error : "+error));

  }

  resendPaytmPaymentLinkRes: any = [];
  resendPaytmPaymentLink(dcoId: any) {

    const requestData = {
      dcoId: dcoId
    };
    //console.log(requestData);

    this.opeas.resendPaytmPaymentLink(JSON.stringify(requestData)).subscribe((data: {}) => {
      this.resendPaytmPaymentLinkRes = data;
      //console.log(this.resendPaytmPaymentLinkRes);

      if (this.resendPaytmPaymentLinkRes.status == 1) {
        this.toastr.success(this.resendPaytmPaymentLinkRes.message);
      } else {
        this.toastr.error(this.resendPaytmPaymentLinkRes.message);
      }

    }, error => {
      //console.log("Error: "+error);
    });

  }

  sendDcoName(data: any) {
    this.dcoSelected.emit(data); // Emit the selected chat to the parent
  }

  fetchAllTagsForFreelancerRes: any = [];
  visibleTags: any[] = []; // Array to manage visible records
  visibleTagsFive: any[] = []; // Array to manage visible records
  displayCount: number = 4; // Number of records to display initially
  totalTagLength: any;
  fetchAllTagsForFreelancer(dcoMobileNumber: any) {
    const requestData = {
      //dcoMobileNumber: "8742812879"
      dcoMobileNumber: dcoMobileNumber
    };
    console.log(requestData);

    this.opeas.fetchAllTagsForFreelancer(JSON.stringify(requestData)).subscribe((data: any) => {
      this.fetchAllTagsForFreelancerRes = data;
      console.log(this.fetchAllTagsForFreelancerRes);

      if (this.fetchAllTagsForFreelancerRes.status === 1) {
        this.totalTagLength = this.fetchAllTagsForFreelancerRes.listOfTags.length;
        this.visibleTags = this.fetchAllTagsForFreelancerRes.listOfTags.slice(0, this.displayCount);
        this.visibleTagsFive = this.fetchAllTagsForFreelancerRes.listOfTags.slice(0, this.displayCount);
      } else {
        this.toastr.error(this.fetchAllTagsForFreelancerRes.message);
      }
    }, error => {
      console.error("Error: ", error);
    });
  }

  // Method to load more records
  loadMore() {
    //const nextCount = this.visibleTags.length + this.displayCount;
    const nextCount = this.totalTagLength;
    this.visibleTags = this.fetchAllTagsForFreelancerRes.listOfTags.slice(0, nextCount);
  }

  get f() { return this.dcoStatusForm.controls; }

  tagList: any=[];
  tagListData: any;
  fetchMainTagsList(){

    this.requestData = {
      //executiveMobileNumber : "8742812879"
      executiveMobileNumber : this.agentNumber,
    };

    this.opeas.fetchMainTags(JSON.stringify(this.requestData)).subscribe((data:{}) => { 
      this.tagList = data;
      this.tagListData = this.tagList.listOfTags;
      //console.log(this.tagList.listOfTags);
      
      // if(this.tagList.status == 1){
          //this.dcoDetailDisplay = true;
      // } else{
          //alert("Driver not allotted to you.");
      // }

    },error =>{
      //console.log("Error: "+error);
    });

  }

  subTagList: any=[];
  fetchSubTagsForMainTags(e: any){

    this.requestData = {
      mainTagText : e.target.value
    };
    
    this.dcoStatusForm.controls['subTag'].setValue('');

    this.opeas.fetchSubTagsForMainTags(JSON.stringify(this.requestData)).subscribe((data:{}) => {
      this.subTagList = data;
      console.log(this.subTagList);
    },error =>{
      //console.log("Error: "+error);
    });

  }

  subtagID: any;
  subTagChangefun(e:any){
    this.subtagID = e.target.value;
  }

  // Add leading zeros to single-digit numbers
  addLeadingZero(num: any) {
    return num < 10 ? '0' + num : num;
  }

  submitted = false;
  responseData: any=[];
  statusUpdate() {
    this.submitted = true;

    //stop here if form is invalid
    if(this.dcoStatusForm.invalid) {
        return;
    }
    //alert(this.dcoStatusForm.get('followUpDateTime').value);
    
    // const DATE_TIME_FORMAT = 'YYYY-MM-DDTHH:mm'; 
    // this.date=new Date(DATE_TIME_FORMAT);

    var today = new Date();
    var date = today.getFullYear() + '-' + this.addLeadingZero(today.getMonth() + 1) + '-' + this.addLeadingZero(today.getDate());
    var time = this.addLeadingZero(today.getHours()) + ':' + this.addLeadingZero(today.getMinutes()) + ':' + this.addLeadingZero(today.getSeconds());
    var dateTime = date + ' ' + time;
    //alert(dateTime);

    this.requestData = {
      freelancerMobileNumber : this.agentNumber,
      dcoMobileNumber : this.dcoNumber,
      tagId : this.subtagID,
      followUpDateTime : dateTime
    };
    console.log(this.requestData);
    //return;

    this.opeas.updateDCOStatusByFreelancer(JSON.stringify(this.requestData)).subscribe((data:{}) => { 
      this.responseData = data;
      //console.log(this.responseData);

      if(this.responseData.status == 1){
        this.submitted = false;
        //this.dcoStatusForm.reset();
        this.dcoStatusForm.controls['tag'].setValue('');
        this.dcoStatusForm.controls['subTag'].setValue('');
        this.toastr.success(this.responseData.message);
        this.fetchAllTagsForFreelancer(this.dcoNumber);
      } else {
        this.toastr.error(this.responseData.message);
        this.dcoStatusForm.controls['tag'].setValue('');
        this.dcoStatusForm.controls['subTag'].setValue('');
      }

    },error =>{
        //console.log("Error: "+error);
        //this.showNotification('top','right','status Not Updated', '1');
    });
  }

}