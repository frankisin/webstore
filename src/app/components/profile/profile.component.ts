import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UserService } from '../../services/userService'; // Assuming you have a service for profile API calls
import { AuthService } from '../../services/authService';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { CartService } from '../../services/cartservice.service';
import { Observable, forkJoin, finalize } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MapDisplayComponent } from '../../dialogue/map-display/map-display.component';
import { LoadingService } from '../../services/loadingService';
import { PaymentMethod } from '../../models/PaymentMethod';
import { ShippingAddress } from '../../models/ShippingAddress';
//import { BreadcrumbModule } from 'primeng/breadcrumb';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { RouterModule } from '@angular/router';
import { TransactionService } from '../../services/transaction.service';
import { LocationService } from '../../services/locationService';
import { StarRatingComponent } from '../star-rating/star-rating.component';



@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,  // Since you're using Angular 17 standalone components
  imports: [ReactiveFormsModule, NavbarComponent, CommonModule, FormsModule, BreadcrumbComponent,RouterModule,StarRatingComponent]
})
export class ProfileComponent implements OnInit {

  //form groups..
  newPaymentForm: FormGroup;
  profileForm: FormGroup;
  shippingForm: FormGroup;
  newShippingForm: FormGroup;

  selectedShippingAddress: any; // Holds the selected shipping address
  selectedPaymentMethod: any; // Holds the selected payment method
  editShipping: any = {}; // Holds the current shipping address being edited

  showEditShippingForm = false; // Toggle for displaying the edit form
  showAddShippingForm = false; // Toggle for displaying the add shipping form
  showEditPaymentForm = false; // Toggle for displaying the edit form
  showAddPaymentForm = false; // Control visibility of the Add Payment form

  editPayment: any = {}; // Object to hold current payment method being edited

  showOrderHistory = false;  // State to toggle order history

  localStores : any = [];


  //user info...
  accountType: string = 'admin';
  username: string = '';
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  streetAddress: string = '';
  city: string = '';
  zipCode: string = '';

  lat : number = 28.100784301757812;
  long : number = -81.6040267944336;


  paymentMethods: PaymentMethod[] = []; // Array to hold existing payment methods
  shippingAddresses: ShippingAddress[] = [];

  items: any[] = [];
  home: any;

  orderHistory = [
    {
      id: 1,
      date: '2024-10-15',
      items: [
        { name: 'Product A', quantity: 2 },
        { name: 'Product B', quantity: 1 }
      ]
    },
    {
      id: 2,
      date: '2024-10-10',
      items: [
        { name: 'Product C', quantity: 3 }
      ]
    }
  ];
  invoices: any[] = [];


  

  constructor(private dialog: MatDialog, private fb: FormBuilder, private profileService: AuthService, private locationService: LocationService, private loadingService: LoadingService, private transactionService: TransactionService) {
    // Initialize the form with empty values or basic validators
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      streetAddress: ['', [Validators.required]],
      city: ['', [Validators.required]],
      zipCode: ['', [Validators.required]],
      state: ['', [Validators.required]],
    });
    this.shippingForm = this.fb.group({
      streetAddress: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5)]]
    });
    // Initialize the form for new payment method
    this.newPaymentForm = this.fb.group({
      cardHolderName : [[Validators.required]],
      cardNumber: ['', [Validators.required, Validators.minLength(16), Validators.maxLength(19)]],
      expirationDate: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
      cvv: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(4)]]
    });
    this.newShippingForm = this.fb.group({
      streetAddress: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5)]],
    });

  }
  ngOnInit(): void {
    this.loadingService.show();
    // Fetch the user profile from your service (API call)

    this.transactionService.fetchInvoice().subscribe({
      next: (userInvoice) => {
        // Handle the user profile data here

        // Sort invoices by InvoiceDate in descending order
      this.invoices = userInvoice.sort((a: any, b: any) => 
      new Date(b.InvoiceDate).getTime() - new Date(a.InvoiceDate).getTime()
    );
        console.log('User Invoice: ',userInvoice);
      },
      error: (err) => {
        console.error('Error fetching user invoice', err);
      }
    });

    //Load near by stores...
    this.locationService.getNearbyStores(this.lat,this.long,10000).subscribe({
      next: (stores) => {
        // Handle the user profile data here

        // Sort invoices by InvoiceDate in descending order
        this.localStores = stores;
        console.log('Local Stores: ',this.localStores);
      },
      error: (err) => {
        console.error('Error fetching nearby stores.', err);
      }
    })

    // Define breadcrumb items
    this.items = [
      { label: 'Store', url: '/store' },
      { label: 'Checkout', url: '/checkout' }
    ];

    // Define home link
    this.home = { icon: 'pi pi-home', url: '/home' };

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


    this.profileService.fetchUserAuthenticated().subscribe({
      next: (userInfo) => {
        // Handle the user profile data here
        console.log(userInfo);

        // Assuming you want to display it in your component's template
        this.username = userInfo.username;
        this.firstName = userInfo.firstName;
        this.lastName = userInfo.lastName;
        this.email = userInfo.email;
        this.streetAddress = userInfo.street;
        this.city = userInfo.city;
        this.zipCode = userInfo.zipCode;
        this.accountType = userInfo.Role;

        this.profileForm.patchValue({
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          streetAddress: userInfo.streetAddress,
          city: userInfo.city,
          zipCode: userInfo.zipCode,
          state: userInfo.state // Assuming state is part of the response
        });

        this.loadingService.hide();

      },
      error: (err) => {
        // Handle error scenario
        this.loadingService.hide();
        console.error('Error fetching user profile', err);
      }
    });
  }
  // Close all forms before opening another one
  private closeAllForms(): void {
    this.showAddPaymentForm = false;
    this.showEditPaymentForm = false;
    this.showAddShippingForm = false;
    this.showEditShippingForm = false;
  }
  toggleOrderHistory(): void {
    this.showOrderHistory = !this.showOrderHistory;
  }
  movePaymentUp(index: number): void {
    if (index > 0) {
      [this.paymentMethods[index - 1], this.paymentMethods[index]] = 
        [this.paymentMethods[index], this.paymentMethods[index - 1]];
      this.updatePrimaryStatus();
    }
  }
  
  movePaymentDown(index: number): void {
    if (index < this.paymentMethods.length - 1) {
      [this.paymentMethods[index + 1], this.paymentMethods[index]] = 
        [this.paymentMethods[index], this.paymentMethods[index + 1]];
      this.updatePrimaryStatus();
    }
  }
  
  updatePrimaryStatus(): void {
    // Mark the first payment method as primary after reordering
    this.paymentMethods.forEach((method, i) => {
      method.isPrimary = i === 0;
    });
  }
  toggleAddPayment(): void {
    this.showAddPaymentForm = !this.showAddPaymentForm;
    
    // Ensure all other forms are closed when this one is opened
    if (this.showAddPaymentForm) {
      this.showEditPaymentForm = false;
      this.showEditShippingForm = false;
      this.showAddShippingForm = false;
    }
  }
  getPaymentIconUrl(type: string): string {
    switch (type.toLowerCase()) {
      case 'visa':
        return 'https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png';
      case 'mastercard':
        return 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg';
      case 'amex':
        return 'https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo_%282018%29.svg';
      default:
        return 'https://via.placeholder.com/50'; // Fallback image
    }
  }
  toggleAddShipping(): void {
    this.showAddShippingForm = !this.showAddShippingForm;
    
    // Ensure all other forms are closed when this one is opened
    if (this.showAddShippingForm) {
      this.showEditShippingForm = false;
      this.showAddPaymentForm = false;
      this.showEditPaymentForm = false;
    }
  }
  
  toggleEditPayment() {
    this.showEditPaymentForm = !this.showEditPaymentForm;
    if (this.showEditPaymentForm) {
      // Initialize the editPayment form with the selected payment method
      this.newPaymentForm.patchValue({
        cardHolderName: this.selectedPaymentMethod.cardHolderName,
        cardNumber: this.selectedPaymentMethod.cardNumber,
        expirationDate: this.selectedPaymentMethod.expirationDate,
        cvv: this.selectedPaymentMethod.cvv
      });
    }
  }
  toggleEditShipping() {
    this.showEditShippingForm = !this.showEditShippingForm;
    if (this.showEditShippingForm) {
      this.newShippingForm.patchValue({
        street: this.selectedShippingAddress.streetAddress,
        city: this.selectedShippingAddress.city,
        state: this.selectedShippingAddress.state,
        zipCode: this.selectedShippingAddress.zipCode
      });
    }
  }
  // Handle form submission for adding a new payment method
  onAddNewPayment() {
    if (this.newPaymentForm.valid) {
      console.log('New Payment to add:', this.newPaymentForm.value);
    }
  }

  // Handle updating the payment method
  onUpdatePayment() {
    console.log('Updated Payment Method:', this.editPayment);
  }
  // Handle the change in the payment method selection
  onPaymentMethodChange(event: any): void {
    const selectedId = +event.target.value;  // Get the selected ID as a number
    this.selectedPaymentMethod = this.paymentMethods.find(pm => pm.id === selectedId);
    if (this.showEditPaymentForm) {
      this.editPayment = { ...this.selectedPaymentMethod };
    }
  }
  onShippingAddressChange(event: any): void {
    const selectedId = +event.target.value;  // Extract the selected ID from the event
    this.selectedShippingAddress = this.shippingAddresses.find(address => address.id === selectedId);
    
    // Optionally, update any related information, like the displayed address
    console.log('Selected Shipping Address:', this.selectedShippingAddress);
  }
  // Handle adding a new shipping address
  onAddNewShippingAddress(): void {
    console.log('New Shipping Address:', this.newShippingForm.value);
  }
  // Handle updating an existing shipping address
  onUpdateShippingAddress(): void {
    console.log('Updated Shipping Address:', this.editShipping);
  }
  // Handle the Pay Now button action
  onSubmit(): void {
    if (this.profileForm.valid) {
      const updatedProfile = this.profileForm.value;
    }
  }
  openMapDialog(): void {
    this.dialog.open(MapDisplayComponent, {
      width: '90vw', // 90% of the viewport width
      height: '85vh', // 90% of the viewport height
      data: { userCoords: { lat: 28.100784301757812, lng: -81.6040267944336 },stores: this.localStores } // Pass user coordinates
    });
  }

}

