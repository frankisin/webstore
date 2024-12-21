import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TransactionService } from '../../services/transaction.service';
import { CommonModule } from '@angular/common'; // Import CommonModule for pipes
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule,NavbarComponent],
  templateUrl: './invoice.component.html',
  styleUrl: './invoice.component.css'
})
export class InvoiceComponent {

  invoice: any; // To store the invoice data

  constructor(private router : Router,private route: ActivatedRoute,private transactionService: TransactionService){

  }
  ngOnInit(): void {
    // Assuming invoice ID is passed via route parameters or retrieved via session/localStorage
    const invoiceId = Number(this.route.snapshot.paramMap.get('id'));

    console.log('Invoice to load:  ',invoiceId);

   
    this.fetchInvoice();
    
  }
  // Fetch the invoice data from a service
  // Fetch the invoice data from the service
fetchInvoice(): void {
  this.transactionService.fetchInvoice().subscribe({
    next: (invoiceData) => {
      // Sort the invoices by InvoiceDate (newest first)
      const sortedInvoices = invoiceData.sort((a: any, b: any) => 
        new Date(b.InvoiceDate).getTime() - new Date(a.InvoiceDate).getTime()
      );

      // Get the most recent invoice
      this.invoice = sortedInvoices[0];

      console.log('Most Recent Invoice:', this.invoice);
    },
    error: (err) => {
      console.error('Error fetching invoice:', err);
    }
  });
}


}
