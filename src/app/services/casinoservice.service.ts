import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, finalize, map, Observable, of, tap, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';


@Injectable({
  providedIn: 'root'
})
export class CasinoService {

  private apiUrl = 'https://localhost:7067';

  constructor(private http: HttpClient, private snackBar: MatSnackBar) { }

  private userBalance: number = 0;
  public userId: number = 1;
  private userBalanceSubject = new BehaviorSubject<number>(0);

  userBalance$ = this.userBalanceSubject.asObservable();

  private balanceUpdateLock = false; // Prevent simultaneous updates

  private balanceBatch: number = 0; // Tracks accumulated balance changes
  private debounceTimer: any = null; // Timer for batching backend updates
  private batchInterval = 2000; // 2 seconds debounce interval


  // Get the username from local storage
  public getUsername(): string | null {
    return localStorage.getItem('username');
  }

  // Fetch user balance and update the subject
  getUserBalance(userId: number): Observable<{ userBalance: number }> {
    return this.http.get<{ userBalance: number }>(`${this.apiUrl}/User/Balance/${userId}`).pipe(
      tap((response) => {
        this.userBalanceSubject.next(response.userBalance);
        console.log('Initial Balance Set:', response.userBalance);
      })
    );
  }

  updateUserBalance(newBalance: number): void {
    this.userBalanceSubject.next(newBalance); // Update HUD immediately
  }


  /**
   * Batch balance updates and send them to the backend after the debounce interval
   */
   batchBalanceUpdate(amount: number): void {
    this.balanceBatch += amount;
    this.userBalanceSubject.next(this.userBalanceSubject.value + amount); // HUD updates immediately
  
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  
    this.debounceTimer = setTimeout(() => {
      this.flushBalanceBatch(); // Send batched updates
    }, this.batchInterval);
  }
  

  /**
   * Send accumulated balance changes to the backend
   */
  private flushBalanceBatch(): void {
    if (this.balanceBatch === 0) return;

    const amountToSend = this.balanceBatch;
    this.balanceBatch = 0; // Reset batch

    this.http
      .put<{ userBalance: number }>(`${this.apiUrl}/User/UpdateBalance/${this.userId}`, amountToSend, {
        headers: { 'Content-Type': 'application/json' },
      })
      .pipe(
        tap((response) => {
          this.userBalanceSubject.next(response.userBalance); // Sync actual backend value
          console.log('Backend updated balance:', response.userBalance);
        }),
        catchError((err) => {
          console.error('Balance batch update failed:', err);
          this.balanceBatch += amountToSend; // Revert batch on failure
          return throwError(() => new Error('Balance update failed'));
        })
      )
      .subscribe();
  }

  placeBet(betAmount: number): Observable<number> {
    if (betAmount > this.userBalanceSubject.value) {
        this.snackBar.open('Insufficient balance!', 'Close', { duration: 3000 });
        return throwError(() => new Error('Insufficient balance'));
    }

    return this.updateBalance(-betAmount).pipe(
        tap(() => {
            console.log(`Bet of ${betAmount} placed successfully.`);
        })
    );
  }
  addWinnings(winnings: number): Observable<number> {
    return this.updateBalance(winnings).pipe(
        tap(() => {
            console.log(`Winnings of ${winnings} added successfully.`);
        })
    );
  }
  updateBalance(amount: number): Observable<number> {
  

    console.log('Attempting to update balance.');
    console.log(`Amount (differential): ${amount}`);
    console.log(`Current Balance: ${this.userBalanceSubject.value}`);

    this.balanceUpdateLock = true;

    return this.http.put<{ userBalance: number }>(
        `${this.apiUrl}/User/UpdateBalance/${this.userId}`,
        amount, // Send `amount` directly as the differential
        { headers: { 'Content-Type': 'application/json' } }
    ).pipe(
        map(response => response.userBalance), // Extract updated balance
        tap(updatedBalance => {
            console.log('Updated Balance (from server):', updatedBalance);
            this.userBalanceSubject.next(updatedBalance); // Update BehaviorSubject
        }),
        catchError(err => {
            console.error('Balance update failed:', err);
            return throwError(() => new Error('Balance update failed'));
        }),
        finalize(() => {
            console.log('Balance update completed.');
            this.balanceUpdateLock = false; // Ensure the lock is released
        })
    );
}

  getUserClaims(): any {
    const token = localStorage.getItem('token');

    //console.log('Token attempting to authenticate: ', token);

    if (token) {
      return this.decodeToken(token);
    }
    return null;
  }
  decodeToken(token: string): any {
    return jwtDecode(token) as any;
  }
}
