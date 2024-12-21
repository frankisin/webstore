import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';


@Injectable({
  providedIn: 'root'
})
export class CartService {

  private apiUrl = 'https://localhost:7067';

  constructor(private http: HttpClient, private snackBar: MatSnackBar) { }
  private userCart: any; // Define the type based on your actual data model
  private cartItems: any[] = [];
  private cartItemsSubject = new BehaviorSubject<any[]>([]);

  cartItems$ = this.cartItemsSubject.asObservable();


  setUserCart(cart: any): void {
    this.userCart = cart;
  }

  getTotalCartQuantity$(): Observable<number> {
    return this.cartItems$.pipe(
      map(cartItems => cartItems.reduce((total, item) => total + item.Quantity, 0))
    );
  }

  // Method to calculate the total amount
  getTotalAmount$(): Observable<number> {
    return this.cartItems$.pipe(
      map(cartItems => cartItems.reduce((total, item) => total + item.Quantity, 0))
    );
  }


  setCartItems(cartItems: any[]): void {
    console.log('Cart items updated:', cartItems); // Add a log to check if this is triggered
    this.cartItemsSubject.next(cartItems); // Trigger all subscribers
  }
  

  deleteCartItem(username: string, itemId: number): Observable<any> {
        //send token with this request because it has to be authorized...
        const headers = new HttpHeaders({
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        });
    const url = `${this.apiUrl}/Carts/${username}/cartitems/${itemId}`;
    return this.http.delete(url,{headers});
  }
  getUserCart(): any {
    return this.userCart;
  }
  // Fetch product details by product ID
  getProductDetails(productId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/Product/${productId}`);
  }

  getCartItems(): any[] {
    return this.cartItems;
  }
  // Get the username from local storage
  public getUsername(): string | null {
    return localStorage.getItem('username');
  }
  // cart.service.ts
  // ... (existing code)

  addToCart(productId: string, quantity: number): Observable<any> {
    const username = this.getUsername();
    if (!username) {
      // Return an observable with an error message
      return of({ error: 'Username not available' });
    }

    let cart = this.getUserCart();

    //Big TODO 
    const addToCartPayload = {
      CartID: cart.ID,
      ProductID: productId,
      Quantity: quantity
    };

    console.log(addToCartPayload);

    //send token with this request because it has to be authorized...
    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    });

    return this.http.post(`${this.apiUrl}/Carts/${username}/cart/AddToCart`, addToCartPayload, { headers }).pipe(
      // Update local cartItems and notify subscribers
      map((userCart: any) => {
        if (userCart && userCart.CartItems) {
          this.cartItems = userCart.CartItems;
          this.setCartItems(this.cartItems);
          //this.addToCartSuccess();
        }
        return userCart;
      })
    );
  }
  fetchUserCart(): Observable<any> {
    const username = this.getUsername();

    if (!username) {
      // Return an observable with an error message
      return of({ error: 'Username not available/Not logged in...' });
    }

        //send token with this request because it has to be authorized...
        const headers = new HttpHeaders({
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        });

    return this.http.get(`${this.apiUrl}/User/ByUsername/${username}/Cart`,{headers}).pipe(
      // Update local cartItems and notify subscribers
      map((userCart: any) => {
        if (userCart && userCart.CartItems) {
          console.log('fetched items...', userCart);
          this.cartItems = userCart.CartItems;
          this.setCartItems(this.cartItems);
        }
        return userCart;
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


  checkout(CardHolderName: string, CardNumber: string, CardExpiry: string, Cvv: string, TotalAmount: string): Observable<any> {

    let emplid;
    //get UserID from jwt 
    const userClaims = this.getUserClaims();
    if (userClaims) {
      const userId = userClaims.UserID; // Ensure the claim key matches what you set in the token
      emplid = userId;
      console.log('User ID from JWT:', userId);

      // Proceed with your submit function, using the userId as needed
    } else {
      console.log('No user claims found or user is not authenticated');
    }

    //send token with this request because it has to be authorized...
    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    });

    console.log('Token: ', localStorage.getItem('token'));

    //construct DTO for 
    const checkoutPayload = {
      UserId: emplid,
      CardHolderName: CardHolderName,
      CardNumber: CardNumber,
      CardExpiry: CardExpiry,
      Cvv: Cvv,
      ShippingAddress: "123 Main St",
      City: "Anytown",
      PostalCode: "12345",
      Country: "USA",
      TotalAmount: TotalAmount
    };

    console.log(checkoutPayload);
    return this.http.post(`${this.apiUrl}/Carts/Checkout`, checkoutPayload, { headers }).pipe(
      tap((response: any) => {
        // Assuming the server sends back a success message or the created invoice
        if (response.success) {
          //this.clearCart(); // Clear the cart if payment is successful
          //this.router.navigate(['/success-page']); // Redirect to a success page
        }
      }),
      catchError((error: any) => {
        console.error('Checkout failed', error);
        // Handle errors, maybe show an error message to the user
        return throwError(() => new Error('Checkout failed, please try again.'));
      })
    );
  }


}
