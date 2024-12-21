import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { StarRatingModule } from 'angular-star-rating';
import { BusyOverlayComponent } from './components/busy-overlay/busy-overlay.component';




@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink,RouterOutlet,StarRatingModule,BusyOverlayComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  constructor(private router: Router) { };
  
  onActivate():void{
    //get current route..
    const currentRoute = this.router.url;
    console.log('Route:',currentRoute);

    if(currentRoute === '/login' || currentRoute === '/register' ){
      // Calculate the offset as 15% of the window's height
      const yOffset = window.innerHeight * 0.25;
      window.scrollTo(0,yOffset);
    }else if(currentRoute === '/checkout'){
      console.log('Checkout page');
      // Calculate the offset as 25% of the window's height
      const yOffset = window.innerHeight;
      window.scrollTo(0,0);
    }
    else if(currentRoute === '/checkout/invoice' ){
      console.log('Checkout page');
      // Calculate the offset as 25% of the window's height
      const yOffset = window.innerHeight * 0.40;
      window.scrollTo(0,yOffset);
    }
    else{
      window.scrollTo(0, 0);
      console.log('Scrolling to top.');
    }
 }
}