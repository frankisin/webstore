import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.css'],
  imports: [CommonModule, RouterModule, RouterLink, ButtonModule],
  standalone: true
})
export class BreadcrumbComponent implements OnInit {
  breadcrumbs: Array<{label: string, link: string}> = [];

  constructor(private router: Router) { }

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.breadcrumbs = this.buildBreadcrumb(this.router.url);
    });
  }

  buildBreadcrumb(url: string): Array<{label: string, link: string}> {
    const parts = url.split('/');
    const breadcrumbs: { label: string; link: string; }[] = [];
    let linkPath = '';

    parts.forEach((part, index) => {
      if (part) {
        linkPath += `/${part}`;
        const label = part.charAt(0).toUpperCase() + part.slice(1);
        breadcrumbs.push({ label, link: linkPath });
      }
    });

    return breadcrumbs;
  }
}
