export class ShippingAddress {
  id: number; // Unique identifier for the address
  userId: number; // The user who owns the shipping address
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isPrimary: boolean;

  constructor(
    id: number,
    userId: number,
    street: string,
    city: string,
    state: string,
    zipCode: string,
    isPrimary: boolean
  ) {
    this.id = id;
    this.userId = userId;
    this.street = street;
    this.city = city;
    this.state = state;
    this.zipCode = zipCode;
    this.isPrimary = isPrimary;
  }
}

  