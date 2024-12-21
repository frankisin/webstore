import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, map, Observable, of, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  private apiUrl = 'https://localhost:7067'; // Update this with your API URL

  constructor(private http: HttpClient) { }

  //LostBorn
  getAllTransactions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Transactions`);
  }
  fetchInvoice(): Observable<any[]> { 

        //send token with this request because it has to be authorized...
        const headers = new HttpHeaders({
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        });

    return this.http.get<any[]>(`${this.apiUrl}/Invoice/Invoice/`,{ headers });
  }
}
