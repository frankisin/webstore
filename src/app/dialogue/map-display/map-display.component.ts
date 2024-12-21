
import { Component, Inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

declare var google: any;

@Component({
  selector: 'app-map-display',
  standalone: true,
  templateUrl: './map-display.component.html',
  imports:[CommonModule]
})
export class MapDisplayComponent implements AfterViewInit {

  private markers: google.maps.Marker[] = []; // Array to hold marker references
  private hurricanePath: google.maps.Polyline | null = null;
  private tampaCircle: google.maps.Circle | null = null;
  private tampaSubCircle: google.maps.Circle | null = null;
  public hazardsVisible = false;

  user = {
    profileImage: 'https://mdbcdn.b-cdn.net/img/Photos/Avatars/avatar-6.webp', // Replace with actual image URL
    name: 'Frank Velazquez',
    email: 'franyer.velazquez@lmco.com',
  };
  map: any;
  
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngAfterViewInit(): void {
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: this.data.userCoords,
      zoom: 12,
    });
  
    // User location marker
    new google.maps.Marker({
      position: this.data.userCoords,
      map: this.map,
      title: "Your Location",
      icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    });
  
    // Store markers
    this.data.stores.forEach((store: any) => {
      new google.maps.Marker({
        position: { lat: store.latitude, lng: store.longitude },
        map: this.map,
        title: store.name,
      });
    });
  
    // Initialize hazards
    this.initHazards(this.map);
  }
  
  private initHazards(map: google.maps.Map): void {
    // Define hurricane path
    const hurricanePathCoordinates = [
      { lat: 27.0, lng: -83.0 },
      { lat: 27.2, lng: -82.8 },
      { lat: 27.5, lng: -82.5 },
      { lat: 27.7, lng: -82.3 },
      { lat: 27.9, lng: -82.0 },
      { lat: 28.0, lng: -81.8 },
      { lat: 28.1, lng: -81.5 },
      { lat: 28.3, lng: -81.0 },
      { lat: 28.5, lng: -80.7 },
      { lat: 28.6, lng: -80.5 },
    ];

    this.hurricanePath = new google.maps.Polyline({
      path: hurricanePathCoordinates,
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });

    // Define circles
    this.tampaCircle = new google.maps.Circle({
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.15,
      center: { lat: 27.3364, lng: -82.5307 },
      radius: 50000,
    });

    this.tampaSubCircle = new google.maps.Circle({
      strokeColor: '#FFA500',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FFA500',
      fillOpacity: 0.1,
      center: { lat: 27.3364, lng: -82.5307 },
      radius: 90000,
    });

    // Initially hide the hazards
    this.hurricanePath?.setMap(null);
    this.tampaCircle?.setMap(null);
    this.tampaSubCircle?.setMap(null);
  }

  toggleHazards(): void {
    this.hazardsVisible = !this.hazardsVisible;

    const map = this.hazardsVisible ? this.map : null;

    // Toggle visibility of the hazards
    this.hurricanePath?.setMap(map);
    this.tampaCircle?.setMap(map);
    this.tampaSubCircle?.setMap(map);
  }
  toggleMarkerVisibility(index: number): void {
    const marker = this.markers[index];
    const store = this.data.stores[index];

    store.isVisible = !store.isVisible; // Toggle visibility state
    marker.setMap(store.isVisible ? marker.getMap() : null); // Show/hide marker
  }

  private drawAdditionalShapes(map: google.maps.Map): void {
    // Draw hurricane path
    const hurricanePathCoordinates = [
      { lat: 27.0, lng: -83.0 }, // Gulf of Mexico
      { lat: 28.1, lng: -81.5 }, // Kissimmee, FL
      { lat: 28.6, lng: -80.5 }, // Near Titusville, FL
    ];

    const hurricanePath = new google.maps.Polyline({
      path: hurricanePathCoordinates,
      geodesic: true,
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });
    hurricanePath.setMap(map);

    // Draw Tampa circles
    const tampaCircle = new google.maps.Circle({
      strokeColor: "#FF0000",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#FF0000",
      fillOpacity: 0.15,
      map: map,
      center: { lat: 27.3364, lng: -82.5307 }, // Tampa coordinates
      radius: 50000,
    });

    const tampaSubCircle = new google.maps.Circle({
      strokeColor: "#FFA500",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#FFA500",
      fillOpacity: 0.1,
      map: map,
      center: { lat: 27.3364, lng: -82.5307 },
      radius: 90000,
    });

    tampaCircle.setMap(map);
    tampaSubCircle.setMap(map);
  }
  centerMapOnStore(store: any): void {
    // Center the map on the store's coordinates
    const map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
      center: { lat: store.latitude, lng: store.longitude },
      zoom: 15, // Zoom in for a closer view
    });
  
    new google.maps.Marker({
      position: { lat: store.latitude, lng: store.longitude },
      map,
      title: store.name,
    });
  }
  // Method to center the map on the user's position
  centerMapOnUser(): void {
    // Recreate the map centered on the user's position
    if (!this.map) return;

  // Update the center and zoom of the existing map
  this.map.setCenter({ lat: this.data.userCoords.lat, lng: this.data.userCoords.lng });
  this.map.setZoom(15); // Adjust zoom level as needed
  

  
    
    // User location marker
    new google.maps.Marker({
      position: this.data.userCoords,
      map: this.map,
      title: "Your Location",
      icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    });
  
    // Store markers
    this.data.stores.forEach((store: any) => {
      new google.maps.Marker({
        position: { lat: store.latitude, lng: store.longitude },
        map: this.map,
        title: store.name,
      });
    });
  }
  
  
  showStoreDetails(store: any): void {
    // Placeholder: Open a dialog or show more information about the store
    alert(`Store: ${store.name}\nAddress: ${store.address}`);
  }
}
