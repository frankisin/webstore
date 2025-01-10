import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, RouterModule } from '@angular/router';
import { CartService } from './services/cartservice.service';
import { UserService } from './services/userService';
import { routes } from './app.routes';
import { AdminGuard } from './services/adminGuardService';
import { BusyOverlayComponent } from './components/busy-overlay/busy-overlay.component';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';
import { SafeHtmlPipe } from './safe-html.pipe';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes),provideHttpClient(),provideAnimations(),SafeHtmlPipe,CartService,UserService,AdminGuard,BusyOverlayComponent,BreadcrumbComponent],

};
