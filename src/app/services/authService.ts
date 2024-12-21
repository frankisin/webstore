import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { map, Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'https://localhost:7067';

  constructor(private http: HttpClient) { }

  // Return server response on login...
  login(username: string, password: string): Observable<any> {
    this.clearUserClaims();
    return this.http.post(`${this.apiUrl}/Auth/login`, { Username: username, Password: password }).pipe(
      catchError(this.handleError)
    );
  }
  // method to handle error..
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Invalid Username or Password.';

    return throwError(errorMessage);
  }
  logout(): void {
    //clearing local storage, revoking tokens, etc.
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('UserID');

  }
  // Check if the user is authenticated by validating the token
  isLoggedIn(): Observable<boolean> {
    const token = localStorage.getItem('token');
    if (!token) {
      return of(false); // If no token, the user is not logged in
    }

    // Send the token to the backend for validation
    return this.http.post<{ valid: boolean }>(`${this.apiUrl}/Auth/validate-token`, { token })
      .pipe(
        map(response => response.valid), // If valid, return true
        catchError(() => of(false))      // In case of an error, consider the token invalid
      );
  }
  fetchUserAuthenticated(): Observable<any> {

    //send token with this request because it has to be authorized...
    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    });

    return this.http.get(`${this.apiUrl}/Auth/profile/`, { headers }).pipe(
      // Update local cartItems and notify subscribers
      map((userInfo: any) => {
        if (userInfo) {
          console.log('fetched user info...', userInfo);
        }
        return userInfo;
      })
    );
  }
  /*
  isLoggedIn(): boolean {
    // Check if the user is logged in based on the presence of the token
    return !!localStorage.getItem('token');
  }
  */

  decodeToken(token: string): any {
    return jwtDecode(token) as any;
  }

  getUserClaims(): any {
    const token = localStorage.getItem('token');

    //console.log('Token attempting to authenticate: ', token);

    if (token) {
      return this.decodeToken(token);
    }
    return null;
  }

  // Check if the user is an admin
  isAdmin(): boolean {
    const userClaims = this.getUserClaims();
    console.log(userClaims);

    return userClaims && userClaims.role === 'admin';
  }
  // clear the claims & user name in local storage.
  clearUserClaims(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
  }
}
