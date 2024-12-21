import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cartservice.service';
import { AuthService } from '../../services/authService';
import { UserService } from '../../services/userService';
import { LostbornService } from '../../services/lostborn.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {

  logo: string = 'Lostborn';
  isAdmin: boolean = false;
  isLoggedIn: boolean = false;
  curUser: string = '';
  totalCartQuantity: number = 0;
  userProfilePicUrl: string = 'https://mdbcdn.b-cdn.net/img/Photos/Avatars/avatar-6.webp';

  private cartItemsSubscription: Subscription | undefined;

  constructor(private lostService: LostbornService, private userService: UserService, public cartService: CartService, private authService: AuthService, private router: Router) { }


  ngOnDestroy(): void {
    // Unsubscribe from the cartItems$ subscription to avoid memory leaks
    if (this.cartItemsSubscription) {
      this.cartItemsSubscription.unsubscribe();
    }
  }
  ngOnInit(): void {
    this.isAdmin = false;
    this.isAdmin = this.authService.isAdmin();
    
    try {
      this.curUser = this.userService.getUserName();
      this.getUserCart();
      // Subscribe to changes in cartItems$

      this.authService.isLoggedIn().subscribe((logResult) => {
        this.isLoggedIn = logResult;
      })

      // Subscribe to changes in cartItems$
      this.cartItemsSubscription = this.cartService.cartItems$.subscribe((cartItems) => {
        console.log('Cart items updated:', cartItems);
        // Update your view logic here based on the new cartItems
      });

      this.cartService.getTotalCartQuantity$().subscribe(quantity => {
        this.totalCartQuantity = quantity;
      });
    }
    catch (ex) {
      console.log(ex);
    }
  }


  getCartItemCount(): number {
    const cartItems = this.cartService.getCartItems();
    return cartItems ? cartItems.length : 0;
  }
  // Function to fetch and log the user's cart
  getUserCart(): void {
    this.lostService.getUserCart(this.curUser).subscribe(
      (response: any) => {

        // Assuming 'response' has properties 'Cart' and 'CartItems'
        const userCart = response.Cart;
        const cartItems = response.Cart?.CartItems || [];
        // Update your service to store the cart and cart items
        this.cartService.setUserCart(userCart);

        this.cartService.setCartItems(response.Cart?.CartItems || []);


      },
      (error) => {
        console.error('Error fetching user cart:', error);
      }
    );
  }
  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    // Additional logic if needed, such as navigating to the home page
    this.router.navigate(['/login']);
  }

}
