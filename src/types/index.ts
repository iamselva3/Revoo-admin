export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATIONS' | 'INSPECTOR';

export type RequestStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'COLLECTION_SCHEDULED'
  | 'ASSIGNED_FOR_COLLECTION'
  | 'COLLECTED'
  | 'RECEIVED_AT_INSPECTION_CENTRE'
  | 'UNDER_INSPECTION'
  | 'FINAL_OFFER_GENERATED'
  | 'AWAITING_CUSTOMER_DECISION'
  | 'OFFER_ACCEPTED'
  | 'OFFER_REJECTED'
  | 'PAYMENT_PROCESSING'
  | 'PAYMENT_COMPLETED'
  | 'RETURN_INITIATED'
  | 'RETURNED'
  | 'CANCELLED';

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: AdminRole;
  lastLogin?: string;
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface SmartphoneModel {
  _id: string;
  brandId: { _id: string; name: string; slug: string; logoUrl?: string } | string;
  name: string;
  slug: string;
  releaseYear: number;
  imageUrl?: string;
  basePrice: number;
  displayOrder?: number;
  /** % of the price taken off per phone-age band (see utils/deviceAge). */
  deviceAgeDeductions?: Partial<Record<'BELOW_3_MONTHS' | '3_TO_6_MONTHS' | '6_TO_11_MONTHS' | 'ABOVE_11_MONTHS', number>>;
  isPublished: boolean;
  isArchived: boolean;
  variants?: Array<{
    _id?: string;
    capacity: string;
    ram?: string;
    storage?: string;
    priceModifier: number;
    isPublished?: boolean;
  }>;
}

export interface StorageVariant {
  _id: string;
  modelId: string;
  capacity: string;
  priceModifier: number;
  isPublished: boolean;
}

export interface PricingRule {
  _id: string;
  modelId: string;
  variantId?: string;
  basePrice: number;
  storagePriceAdjustment: number;
  deductions: {
    display: {
      FLAWLESS: number;
      MINOR_SCRATCHES: number;
      DEEP_SCRATCHES: number;
      CRACKED_GLASS: number;
      BROKEN_OR_DEAD_PIXELS: number;
    };
    body: {
      FLAWLESS: number;
      MINOR_SIGNS_OF_USE: number;
      DENTED_OR_SCRATCHED: number;
      BENT_OR_CRACKED_BACK: number;
    };
    battery: {
      EXCELLENT: number;
      GOOD: number;
      DEGRADED: number;
    };
    functional: {
      frontCameraFaulty: number;
      backCameraFaulty: number;
      faceIdOrFingerprintFaulty: number;
      speakerOrMicFaulty: number;
      chargingPortFaulty: number;
      wirelessOrBluetoothFaulty: number;
    };
    accessoriesBonus: {
      hasOriginalBox: number;
      hasOriginalCharger: number;
    };
    basicQuestions?: {
      phoneNotWorking?: number;
      touchscreenNotWorking?: number;
      displayNotOriginal?: number;
      noWarranty?: number;
    };
    backPanel?: {
      NO_DEFECTS?: number;
      MINOR_SCRATCHES?: number;
      HEAVY_SCRATCHES?: number;
      BACK_PANEL_BROKEN?: number;
    };
    sidePanel?: {
      NO_DEFECTS?: number;
      MINOR_DENT_OR_SCRATCHES?: number;
      HEAVY_DENT?: number;
      BENT_OR_BROKEN?: number;
    };
    hardwareFaults?: {
      powerButtonNotWorking?: number;
      volumeButtonNotWorking?: number;
      chargingPortNotWorking?: number;
      earSpeakerNotWorking?: number;
      proximitySensorNotWorking?: number;
      wifiOrBluetoothNotWorking?: number;
      vibratorNotWorking?: number;
    };
  };
  deductionPercentages?: {
    basicQuestions?: {
      phoneNotWorking?: number;
      touchscreenNotWorking?: number;
      displayNotOriginal?: number;
      noWarranty?: number;
    };
    backPanel?: {
      NO_DEFECTS?: number;
      MINOR_SCRATCHES?: number;
      HEAVY_SCRATCHES?: number;
      BACK_PANEL_BROKEN?: number;
    };
    sidePanel?: {
      NO_DEFECTS?: number;
      MINOR_DENT_OR_SCRATCHES?: number;
      HEAVY_DENT?: number;
      BENT_OR_BROKEN?: number;
    };
    hardwareFaults?: {
      powerButtonNotWorking?: number;
      volumeButtonNotWorking?: number;
      chargingPortNotWorking?: number;
      earSpeakerNotWorking?: number;
      proximitySensorNotWorking?: number;
      wifiOrBluetoothNotWorking?: number;
      vibratorNotWorking?: number;
    };
    /** % of the phone's price taken off for each age band the customer can pick. */
    deviceAge?: Partial<Record<'BELOW_3_MONTHS' | '3_TO_6_MONTHS' | '6_TO_11_MONTHS' | 'ABOVE_11_MONTHS', number>>;
    display: {
      FLAWLESS: number;
      MINOR_SCRATCHES: number;
      DEEP_SCRATCHES: number;
      CRACKED_GLASS: number;
      BROKEN_OR_DEAD_PIXELS: number;
    };
    body: {
      FLAWLESS: number;
      MINOR_SIGNS_OF_USE: number;
      DENTED_OR_SCRATCHED: number;
      BENT_OR_CRACKED_BACK: number;
    };
    battery: {
      EXCELLENT: number;
      GOOD: number;
      DEGRADED: number;
    };
    functional: {
      frontCameraFaulty: number;
      backCameraFaulty: number;
      faceIdOrFingerprintFaulty: number;
      speakerOrMicFaulty: number;
      chargingPortFaulty: number;
      wirelessOrBluetoothFaulty: number;
    };
  };
  version: number;
  isActive: boolean;
  effectiveFrom: string;
}

export interface BuybackRequest {
  _id: string;
  requestNumber: string;
  userId: string | { _id: string; fullName: string; phone: string; email?: string };
  customerDetails: {
    fullName: string;
    phone: string;
    email?: string;
  };
  deviceDetails: {
    brandId: string;
    brandName: string;
    modelId: string;
    modelName: string;
    variantId?: string;
    storageCapacity: string;
    imeiOrSerial?: string;
  };
  declaredCondition: {
    displayCondition?: string;
    bodyCondition?: string;
    screenDisplayCondition?: string;
    touchGlassCondition?: string;
    backPanelCondition?: string;
    sidePanelCondition?: string;
    batteryHealth?: string;
    hasValidBill?: boolean;
    summary?: Array<{ title: string; items: string[] }>;
    basicQuestions?: any;
    hardwareFaults?: any;
    functionalFaults?: {
      frontCameraFaulty?: boolean;
      backCameraFaulty?: boolean;
      faceIdOrFingerprintFaulty?: boolean;
      speakerOrMicFaulty?: boolean;
      chargingPortFaulty?: boolean;
      wirelessOrBluetoothFaulty?: boolean;
    };
    hasOriginalBox?: boolean;
    hasOriginalCharger?: boolean;
    additionalNotes?: string;
  };
  indicativeEstimate: {
    basePrice: number;
    storageAdjustment: number;
    totalDeductions: number;
    totalBonuses: number;
    estimatedAmount: number;
    pricingRuleVersion: number;
    breakdown: Array<{
      component: string;
      description: string;
      adjustment: number;
    }>;
  };
  photoUrls: string[];
  pickupAddress: {
    street: string;
    area?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
    preferredSlot?: string;
  };
  scheduledPickupDate?: string;
  preferredTimeWindow?: string;
  payoutDetails?: {
    method: 'UPI' | 'BANK_TRANSFER' | 'INSTANT_CASH';
    upiId?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };
  status: RequestStatus;
  timeline: Array<{
    status: RequestStatus;
    timestamp: string;
    note?: string;
    updatedBy?: string;
  }>;
  assignedCollector?: {
    staffId?: string;
    staffName?: string;
    scheduledDate?: string;
    timeSlot?: string;
  };
  activeOfferId?: {
    _id: string;
    finalOfferedAmount: number;
    valuationExplanation: string;
    status: string;
    validUntil: string;
    offerVersion: number;
  };
  inspectionId?: {
    _id: string;
    inspectorName: string;
    suggestedOfferAmount: number;
    discrepancies: string[];
    customerVisibleNotes?: string;
    internalInspectionNotes?: string;
    completedAt: string;
  };
  paymentId?: {
    _id: string;
    amount: number;
    paymentMethod: string;
    paymentReference: string;
    paidAt: string;
  };
  returnId?: {
    _id: string;
    assignedStaffName?: string;
    status: string;
    trackingReference?: string;
    scheduledReturnDate?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  totalRequests: number;
  newRequests: number;
  underReview: number;
  collectionPending: number;
  devicesCollected: number;
  inspectionsPending: number;
  awaitingCustomerDecision: number;
  acceptedOffers: number;
  rejectedOffers: number;
  paymentsPending: number;
  completedTransactions: number;
  returnsPending: number;
  openEnquiries: number;
}

export interface RefurbishedProduct {
  _id: string;
  name: string;
  brand: string;
  category?: string;
  storage: string;
  color: string;
  grade: 'PRISTINE' | 'EXCELLENT' | 'VERY_GOOD';
  batteryHealth: number;
  originalPrice: number;
  salePrice: number;
  discountPercentage: number;
  offerTag?: string;
  warrantyMonths: number;
  imageUrl: string;
  galleryImages?: string[];
  inspectionScore: number;
  inStock: boolean;
  isFeatured: boolean;
  highlights: string[];
  createdAt?: string;
  updatedAt?: string;
}


