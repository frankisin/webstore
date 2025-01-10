import { Routes } from '@angular/router';

import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { StoreComponent } from './components/store/store.component';
import { DetailComponent } from './components/detail/detail.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { AdminGuard } from './services/adminGuardService';
import { ProfileComponent } from './components/profile/profile.component';
import { AuthGuard } from './services/authGuardService';
import { InvoiceComponent } from './components/invoice/invoice.component';
import { GameComponent } from './components/game/game.component';
import { CasinoComponent } from './components/casino/casino.component';
import { CasinoHomeComponent } from './components/casino-home/casino-home.component';
import { DiceComponent } from './components/dice/dice.component';
import { MinesComponent } from './components/mines/mines.component';

export const routes: Routes = [
    { path: '',   redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: LandingPageComponent, },
    { path: 'dashboard', component: DashboardComponent,canActivate:[AuthGuard,AdminGuard] },
    { path: 'store', component: StoreComponent},
    { path : 'checkout', component:CheckoutComponent,canActivate:[AuthGuard,AdminGuard]},
    { path : 'checkout/invoice',component:InvoiceComponent,canActivate:[AuthGuard,AdminGuard]},
    { path: 'store/detail', component: DetailComponent },
    { path: 'login', component:LoginComponent},
    { path: 'register', component:RegisterComponent},
    { path: 'profile',component:ProfileComponent,canActivate:[AuthGuard]},
    { path: 'game',component:GameComponent,canActivate:[AuthGuard,AdminGuard]},
    { path: 'plinko',component:CasinoComponent,canActivate:[AuthGuard,AdminGuard]},
    { path: 'dice',component:DiceComponent,canActivate:[AuthGuard,AdminGuard]},
    { path: 'casino-home',component:CasinoHomeComponent,canActivate:[AuthGuard,AdminGuard]},
    { path: 'mines',component:MinesComponent,canActivate:[AuthGuard,AdminGuard]}
];