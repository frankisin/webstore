import { Router } from '@angular/router';
import { Component, NgModule } from '@angular/core';
import { FormBuilder, FormsModule, Validators } from '@angular/forms';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { CartService } from '../../services/cartservice.service';
import { Observable, forkJoin, finalize } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingService } from '../../services/loadingService';
import { PaymentMethod } from '../../models/PaymentMethod';
import { ShippingAddress } from '../../models/ShippingAddress';


@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [NavbarComponent, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent {
  checkoutModel: any;

  checkoutForm: FormGroup;
  cartItems: any[] = []; // Assuming your cartItems structure
  displayCart: any[] = [];
  userName: string = '';

  selectedShippingAddress: any; // Holds the selected shipping address
  selectedPaymentMethod: any; // Holds the selected payment method

  shippingForm: FormGroup;

  showAddPaymentForm = false;
  showAddShippingForm = false;
  loading = true;
  

  paymentMethods: PaymentMethod[] = []; // Array to hold existing payment methods
  shippingAddresses: ShippingAddress[] = [];

  

  constructor(public cartService: CartService, private snackBar: MatSnackBar, private loadingService: LoadingService, private router: Router, private fb: FormBuilder) {
    this.checkoutForm = new FormGroup({
      cardHolderName: new FormControl(''),
      cardNumber: new FormControl(''),
      expirationDate: new FormControl(''),
      cvv: new FormControl('')
    });
    this.shippingForm = this.fb.group({
      streetAddress: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5)]]
    });
  }
  
  



  ngOnInit(): void {
  this.loading = true; // Start with loading spinner visible

  console.log('Loading flag: ',this.loading);

  this.shippingAddresses = [
    new ShippingAddress(1, 101, '123 Main St', 'Anytown', 'CA', '90210',true),
    new ShippingAddress(2, 101, '456 Elm St', 'Othertown', 'NY', '10001',false)
  ];

  this.paymentMethods = [
    {
      id: 1,
      cardNumber: '1234 5678 9012 3456',
      cardHolderName: 'Frank Velazquez',
      expirationDate: '09/2025',
      cvv: '079',
      isDefault: true,
      type: 'visa',
      pictureUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png',
      isPrimary:true
    },
    {
      id: 2,
      cardNumber: '9876 5432 1098 7654',
      cardHolderName: 'Frank Velazquez',
      expirationDate: '09/2025',
      cvv: '258',
      isDefault: false,
      type: 'mastercard',
      pictureUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg',
      isPrimary: false
    }
  ];
  

  // Automatically set the first payment method as selected when loaded
  this.selectedPaymentMethod = this.paymentMethods[0];  // Select the first payment method by default
  this.selectedShippingAddress = this.shippingAddresses[0];

  const user = this.cartService.getUsername();
  if (user) {
    this.userName = user;

    // Subscribe to cart items observable
    this.cartService.cartItems$.subscribe({
      next: (cartItems) => {
        this.transformCartItems(cartItems);
        console.log('Cart fetched.');
        // Set loading to false only after data is fetched
    
      },
      error: (err) => {
        console.error('Error fetching cart items:', err);
        this.loading = false; // Stop loading if there's an error
      },
    });
  } else {
    console.error('Username not available');
 
  }
  
  this.loading = false;
  console.log('Loading flag: ',this.loading);
}

  
  onGoStore(): void {
    this.router.navigate(['/store']);
  }
  // Calculate subtotal for all items in the cart
  calculateSubtotal(): number {
    let subtotal = 0;

    // Iterate through cart items and sum the price times quantity
    this.displayCart.forEach(displayItem => {
      subtotal += displayItem.ProductDetails.Price * displayItem.Quantity;
    });

    return subtotal;
  }
  onSubmit() {

    this.loadingService.show();

    // Extract values from the form
    const { cardHolderName, cardNumber, expirationDate, cvv } = this.checkoutForm.value;

    //get total price...
    const totalPrice = this.calculateTotal();

    console.log('Form data submitted:', this.checkoutForm.value);

    console.log('Total price: ', totalPrice.toFixed(2));

    this.cartService.checkout(cardHolderName, cardNumber, expirationDate, cvv, totalPrice.toString())
      .pipe(
        finalize(() => {
          this.loadingService.hide();  // Hide the overlay once the request completes (either success or error)
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Checkout successful', response);
          // Optionally, add success handling logic here
          this.loadingService.hide();

          this.router.navigate(['/checkout/invoice', { id: response.Invoice.InvoiceID }]);

        },
        error: (error) => {
          this.loadingService.hide();
          console.error('Checkout failed', error);
          // Optionally, add error handling logic here
        }
      });
  }
  toggleAddPayment(): void {
    this.showAddPaymentForm = !this.showAddPaymentForm;
  }

  toggleAddShipping(): void {
    this.showAddShippingForm = !this.showAddShippingForm;
  }
  calculateTotal(): number {
    return this.calculateSubtotal() * 1.07 + 20; // Example calculation
  }
  

  onDelete(username: string, itemId: number): void {
    console.log('Deleting username: ', username, ' item ID: ', itemId);

    this.loadingService.show();
    this.loading = true;
    this.cartService.deleteCartItem(username, itemId).subscribe(
      (response) => {
        this.loadingService.hide();
        this.loading = false;
        // If response contains updated cart items, directly update the cart
        if (response) {
          console.log('response after deletion:', response);
          this.cartService.setCartItems(response.Cart.CartItems);
          
          // Show success toast notification
          this.snackBar.open('Item removed from cart!', 'Close', {
            duration: 3000,
          });
        } else {
          // Fallback: fetch the cart if the API doesn't return updated cart items
          this.cartService.fetchUserCart().subscribe((userCart) => {
            if (userCart && userCart.CartItems) {
              this.cartService.setCartItems(userCart.CartItems);
            }
          });
        }
      },
      (error) => {
        this.loadingService.hide();
        console.error('Error deleting item from cart:', error);
        this.snackBar.open('Error deleting item from cart. Please try again.', 'Close', {
          duration: 3000,
        });
      }
    );
  }




  transformCartItems(cartItems: any[]): void {
    // Reset the displayCart array
    this.displayCart = [];

    // Create an array to store the observables for getProductDetails
    const productDetailObservables: Observable<any>[] = [];

    // Iterate through each cart item
    for (const cartItem of cartItems) {
      // Push each observable to the array
      productDetailObservables.push(
        this.cartService.getProductDetails(cartItem.ProductID)
      );
    }

    // Use forkJoin to wait for all getProductDetails observables to complete
    forkJoin(productDetailObservables).subscribe((productDetailsArray: any[]) => {
      // Iterate through each cart item and its corresponding product details
      for (let i = 0; i < cartItems.length; i++) {
        const cartItem = cartItems[i];
        const productDetails = productDetailsArray[i];

        const displayItem = {
          ID: cartItem.ID,
          Title: productDetails.Title,
          Description: productDetails.Description,
          AverageRating: productDetails.AverageRating,
          DescriptionLong: productDetails.DescriptionLong,
          ProductID: cartItem.ProductID,
          Quantity: cartItem.Quantity,
          ImageUrlDetail: productDetails.ImageUrlDetail,
          ProductDetails: productDetails,
        };

        // Push the combined item to the displayCart array
        this.displayCart.push(displayItem);
      }

      console.log('Cart cards generated: ', this.displayCart);
    });
  }


}
