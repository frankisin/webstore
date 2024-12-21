// admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { AuthService } from './authService'; //authentication service.

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): boolean | UrlTree {
    console.log('Is user admin: ',this.authService.isAdmin() );
    if (this.authService.isAdmin()) {
      //If auth Service result for this user is true then canActivate is true. 
      return true;
    } else {
      // Redirect to store.
      console.log('Welcome User');
      return this.router.parseUrl('/store');
    }
  }

}
