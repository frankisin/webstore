export interface PaymentMethod {
    id: number;
    cardNumber: string;
    cardHolderName : string;
    expirationDate: string;
    cvv : string;
    isDefault : boolean;
    type: string;
    pictureUrl:string;
    isPrimary:boolean;
  }
  