import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/authService';
import { UserService } from '../../services/userService'; // Update the path
import { LoadingService } from '../../services/loadingService';
import { Observable, forkJoin, finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NavbarComponent, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm!: FormGroup;
  failedLoginAttempt : boolean = false;
  errorMessage : string = '';
  isLoggedIn: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private userService: UserService, // Inject the UserService
    private loadingService: LoadingService
  ) {
    // Initialize the form with validators
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }
  ngOnInit(): void {
    this.authService.isLoggedIn().subscribe((logResult) => {
      console.log('Login result:', logResult);
      if(logResult){
        this.router.navigate(['/profile']);
      }
      this.isLoggedIn = logResult;
    })
    if(this.isLoggedIn){
      console.log('User is logged in, redirecting.');
    }
  }

  // Function to handle the login logic
  login(): void {
    const { username, password } = this.loginForm.value;

    this.loadingService.show();

    // Call AuthService to send the login request
    this.authService.login(username, password).pipe(
      finalize(() => {
        this.loadingService.hide();  // Hide the overlay once the request completes
      })).subscribe(
      (response: any) => {
        // Successfully logged in
        console.log('response: ', response);

        localStorage.setItem('token', response.Token);

        // Extract the role from the decoded token
        const decodedToken = this.authService.decodeToken(response.Token);
        console.log('Decoded token: ', decodedToken);
        const userRole = decodedToken.role; // Adjust this based on your token structure

        // Save the role in local storage
        localStorage.setItem('role', userRole);

        // Assuming your decoded token contains a 'username' field
        const usernameFromToken = decodedToken.unique_name;

        console.log('Decoded Username: ', usernameFromToken);

        // Store the username in local storage
        localStorage.setItem('username', usernameFromToken);

        // Navigate to the appropriate page...
        this.redirectBasedOnRole(userRole);


      },
      // Handle login error
      (error) => {
        console.error('Login failed: ', error);
        // trigger failed login attempt flag
        this.failedLoginAttempt = true;
        this.errorMessage = error;
      }
    );
  }

  private redirectBasedOnRole(role: string): void {
    // Define the routes for different roles
    const adminRoute = '/dashboard';
    const userRoute = '/user-dashboard'; // Adjust this based on your routes

    // Check the role and navigate accordingly
    if (role === 'admin') {
      console.log('Welcome admin, navigating to dashboard');
      this.router.navigate(['/dashboard']);
    } else {
      console.log('Welcome User, navigating to Store.')
      this.router.navigate(['/store']);
    }
  }

}
