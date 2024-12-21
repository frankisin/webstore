import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LostbornService {

  private apiUrl = 'https://localhost:7067'; // Update this with your API URL

  //send token with this request because it has to be authorized...


  constructor(private http: HttpClient) { }

  //LostBorn
  getAllMembers(): Observable<any[]> {

    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    });

    return this.http.get<any[]>(`${this.apiUrl}/LostBorn`,{ headers });

  }
  getMember(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/LostBorn/${id}`);
  }

  addMember(member: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/LostBorn`, member);
  }

  updateMember(member: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/LostBorn`, member);
  }

  deleteMember(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/LostBorn/${id}`);
  }
  //Product
  getAllProductData(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Product`);
  }

  getProductData(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/Product/${id}`);
  }

  addProductData(product: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/Product`, product);
  }

  updateProductData(product: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/Product`, product);
  }

  deleteProductData(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/Product/${id}`);
  }

  //Users
  getAllUserData(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/User`);
  }

  getUserData(id: number): Observable<any> {
    
    return this.http.get<any>(`${this.apiUrl}/User/${id}`);
  }

  addUserData(user: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/User`, user);
  }

  updateUserData(user: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/User`, user);
  }

  deleteUserData(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/User/${id}`);
  }
  getUserCart(username: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/User/ByUsername/${username}/Cart`);
  }

}
