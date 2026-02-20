import { Component, OnInit } from '@angular/core';
import { NgStyle, CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IconDirective } from '@coreui/icons-angular';
import { ContainerComponent, RowComponent, ColComponent, CardGroupComponent, TextColorDirective, CardComponent, CardBodyComponent, FormDirective, InputGroupComponent, InputGroupTextDirective, FormControlDirective, ButtonDirective } from '@coreui/angular';
import { OnewayNodeService } from '../../../../app/service/oneway-node.service';
import { PySmartChatService } from '../../../../app/service/py-smart-chat.service';
import { ChatService } from '../../../../app/service/chat.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, ContainerComponent, RowComponent, ColComponent, CardGroupComponent, TextColorDirective, CardComponent, CardBodyComponent, FormDirective, InputGroupComponent, InputGroupTextDirective, IconDirective, FormControlDirective, ButtonDirective, NgStyle]
})
export class LoginComponent implements OnInit {

  constructor(private fb: FormBuilder,
              private pscs: PySmartChatService,
              private ons: OnewayNodeService,
              private chatService: ChatService,
              private router: Router,
              private toastr: ToastrService) { }

  returnUrl: string = '';
  ngOnInit(): void {
    this.returnUrl = '/base/dashboard';
  }

  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });
  get f() { return this.loginForm.controls; }

  submitted = false;
  loading = false;
  requestData: any = {};
  responseData: any = [];
  message: any;

  onSubmit() {
    this.submitted = true;
    if (this.loginForm.invalid) {
      return;
    }

    this.requestData = {
      username: this.loginForm.get("username")!.value,
      password: this.loginForm.get("password")!.value,
      login_from: "customercare"
    };

    this.loading = true;

    this.pscs.loginV2(this.requestData).subscribe({
      next: (data: any) => {
        this.responseData = data;
        console.log(this.responseData);

        if (this.responseData.accessToken) {
          const loginDetails = {
            isLoggedIn: true,
            date_time: new Date(),
            accessToken: this.responseData.accessToken,
            agentNumber: this.responseData.agentNumber,
            adminUserId: this.responseData.adminid,
            executive_id: this.responseData.adminid,
            executive_name: this.responseData.name
          };

          const usernameControl = this.loginForm.get("username");
          if (usernameControl && usernameControl.value) {
            localStorage.setItem(usernameControl.value + "-loginDetails", JSON.stringify(loginDetails));
            localStorage.setItem("userRole", usernameControl.value);
          }

          // Connect WebSocket with JWT
          this.chatService.connect(this.responseData.accessToken);

          this.loading = false;
          this.router.navigate([this.returnUrl]);
        } else {
          this.message = this.responseData.message || 'Login failed';
          this.toastr.error(this.message);
          this.submitted = false;
          this.loading = false;
          this.loginForm.reset();
        }
      },
      error: (error) => {
        console.log("Login Error:", error);
        this.toastr.error('Login failed. Please try again.');
        this.submitted = false;
        this.loading = false;
      }
    });
  }

}
