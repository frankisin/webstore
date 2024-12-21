import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';
import { map, Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private apiUrl = 'https://localhost:7067';

  constructor(private http: HttpClient) { }

}
