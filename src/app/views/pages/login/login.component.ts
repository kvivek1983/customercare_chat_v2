import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IconDirective } from '@coreui/icons-angular';
import { OnewayNodeService } from '../../../../app/service/oneway-node.service';
import { PySmartChatService } from '../../../../app/service/py-smart-chat.service';
import { ChatService } from '../../../../app/service/chat.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, IconDirective]
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
            refreshToken: this.responseData.refreshToken || null,
            agentNumber: this.responseData.agentNumber,
            adminUserId: this.responseData.adminid,
            executive_id: this.responseData.adminid,
            // V2 login may not return 'name'; fall back to username
            executive_name: this.responseData.name || this.loginForm.get("username")?.value || ''
          };

          const usernameControl = this.loginForm.get("username");
          if (usernameControl && usernameControl.value) {
            localStorage.setItem(usernameControl.value + "-loginDetails", JSON.stringify(loginDetails));
            localStorage.setItem("userRole", usernameControl.value);
          }

          // Also login to Node server for DCO/Partner APIs
          const nodeLoginData = {
            username: this.loginForm.get("username")!.value,
            password: this.loginForm.get("password")!.value,
            login_from: "customercare"
          };
          this.ons.login(JSON.stringify(nodeLoginData)).subscribe({
            next: (nodeRes: any) => {
              console.log('Node login response:', nodeRes);
              if (nodeRes && nodeRes.accessToken) {
                // Store node token in the same loginDetails
                const userRole = localStorage.getItem('userRole');
                if (userRole) {
                  try {
                    const stored = JSON.parse(localStorage.getItem(`${userRole}-loginDetails`) || '{}');
                    stored.nodeAccessToken = nodeRes.accessToken;
                    localStorage.setItem(`${userRole}-loginDetails`, JSON.stringify(stored));
                  } catch (e) {
                    console.error('Failed to store node token:', e);
                  }
                }
              }
            },
            error: (err) => {
              console.warn('Node login failed (DCO features may not work):', err);
            }
          });

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
