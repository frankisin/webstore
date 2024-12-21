import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LocationService {
    private apiUrl = 'http://localhost:3000/nearby-stores';  // express restful api...

    constructor(private http: HttpClient) {}

    getNearbyStores(lat: number, long: number, radius: number): Observable<any> {
        return this.http.get(`${this.apiUrl}?lat=${lat}&lon=${long}&radius=${radius}`);
    } 
}
