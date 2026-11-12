import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  MapPin,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  Smartphone,
  Truck,
  User,
  AlertTriangle,
  Info,
  Sparkles,
  Star,
  Users,
  Check,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { BuybackRequest, RequestStatus } from '../../types';

export const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Active action modal
  const [activeModal, setActiveModal] = useState<
    'ASSIGN_COLLECTION' | 'UPDATE_COLLECTION' | 'INSPECTION' | 'FINAL_OFFER' | 'RECORD_PAYMENT' | 'INITIATE_RETURN' | null
  >(null);

  // Form states
  const [collectionStaff, setCollectionStaff] = useState('M. Senthil Murugan');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [collectionDate, setCollectionDate] = useState(
    new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [collectionSlot, setCollectionSlot] = useState('Morning (10:00 AM - 01:00 PM)');
  const [collectionNotes, setCollectionNotes] = useState('');

  // Inspection form
  const [inspDisplay, setInspDisplay] = useState('FLAWLESS');
  const [inspBody, setInspBody] = useState('MINOR_SIGNS_OF_USE');
  const [inspBattery, setInspBattery] = useState('EXCELLENT');
  const [screenFunctional, setScreenFunctional] = useState(true);
  const [touchFunctional, setTouchFunctional] = useState(true);
  const [camerasFunctional, setCamerasFunctional] = useState(true);
  const [biometricsFunctional, setBiometricsFunctional] = useState(true);
  const [discrepancyText, setDiscrepancyText] = useState('');
  const [suggestedOffer, setSuggestedOffer] = useState<number>(0);
  const [inspectorNotes, setInspectorNotes] = useState('');
  const [customerVisibleNotes, setCustomerVisibleNotes] = useState('');

  // Final offer form
  const [finalOfferAmount, setFinalOfferAmount] = useState<number>(0);
  const [offerExplanation, setOfferExplanation] = useState('');
  const [offerInternalNotes, setOfferInternalNotes] = useState('');

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Return form
  const [returnStaff, setReturnStaff] = useState('Suresh Patel');
  const [returnTracking, setReturnTracking] = useState('');
  const [returnNotes, setReturnNotes] = useState('');

  const { data: request, isLoading } = useQuery<BuybackRequest>({
    queryKey: ['admin-request-detail', id],
    queryFn: async () => {
      const res = await apiClient.get(`/requests/admin/${id}`);
      return res.data.data;
    },
  });

  useEffect(() => {
    if (request) {
      setSuggestedOffer(request.indicativeEstimate?.estimatedAmount || 0);
      setFinalOfferAmount(request.indicativeEstimate?.estimatedAmount || 0);
      setPaymentAmount(request.activeOfferId?.finalOfferedAmount || request.indicativeEstimate?.estimatedAmount || 0);
      setReturnTracking(`RET-${request.requestNumber}`);
    }
  }, [request]);

  const mutation = useMutation({
    mutationFn: async ({ endpoint, payload, method = 'post' }: { endpoint: string; payload: any; method?: string }) => {
      if (method === 'put') {
        return (await apiClient.put(endpoint, payload)).data;
      }
      return (await apiClient.post(endpoint, payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-request-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setActiveModal(null);
    },
  });

  if (isLoading || !request) {
    return <div className="p-12 text-center text-slate-500">Loading request dossier...</div>;
  }

  const requestPincode = request?.pickupAddress?.pincode || '';
  const requestDistrict = request?.pickupAddress?.city || request?.pickupAddress?.state || '';

  const { data: staffRecommendations = [], isLoading: isStaffLoading } = useQuery({
    queryKey: ['staff-recommendations', requestPincode, requestDistrict],
    queryFn: async () => {
      const res = await apiClient.get('/employees/recommend', {
        params: {
          pincode: requestPincode,
          district: requestDistrict,
        },
      });
      return res.data.data;
    },
    enabled: activeModal === 'ASSIGN_COLLECTION' || !!request,
  });

  const handleAssignCollection = () => {
    mutation.mutate({
      endpoint: `/requests/admin/${id}/assign-collection`,
      payload: {
        collectorStaffId: selectedStaffId || '65e94b281b37f40192a54321',
        collectorStaffName: collectionStaff,
        scheduledDate: collectionDate,
        timeSlot: collectionSlot,
        notes: collectionNotes,
      },
    });
  };

  const handleUpdateCollectionStatus = (newStatus: string) => {
    mutation.mutate({
      endpoint: `/requests/admin/${id}/collection-status`,
      method: 'put',
      payload: { status: newStatus, notes: collectionNotes || `Status updated to ${newStatus}` },
    });
  };

  const handleSubmitInspection = () => {
    const discrepancies = discrepancyText.split('\n').filter((d) => d.trim().length > 0);
    mutation.mutate({
      endpoint: `/requests/admin/${id}/inspection`,
      payload: {
        actualCondition: {
          displayCondition: inspDisplay,
          bodyCondition: inspBody,
          batteryHealth: inspBattery,
          functionalFaults: request.declaredCondition.functionalFaults,
          hasOriginalBox: request.declaredCondition.hasOriginalBox,
          hasOriginalCharger: request.declaredCondition.hasOriginalCharger,
          screenFunctional,
          touchFunctional,
          camerasFunctional,
          biometricsFunctional,
        },
        discrepancies,
        suggestedOfferAmount: suggestedOffer,
        internalInspectionNotes: inspectorNotes,
        customerVisibleNotes,
      },
    });
  };

  const handleGenerateFinalOffer = () => {
    mutation.mutate({
      endpoint: `/requests/admin/${id}/final-offer`,
      payload: {
        finalOfferedAmount: finalOfferAmount,
        valuationExplanation: offerExplanation || 'Inspection completed. Condition verified and adjusted.',
        internalNotes: offerInternalNotes,
        validityDays: 7,
      },
    });
  };

  const handleRecordPayment = () => {
    mutation.mutate({
      endpoint: `/requests/admin/${id}/payments`,
      payload: {
        amount: paymentAmount,
        paymentMethod,
        paymentReference,
        notes: paymentNotes,
      },
    });
  };

  const handleInitiateReturn = () => {
    mutation.mutate({
      endpoint: `/requests/admin/${id}/returns`,
      payload: {
        assignedStaffName: returnStaff,
        trackingReference: returnTracking,
        notes: returnNotes,
      },
    });
  };

  const handleCompleteReturn = () => {
    mutation.mutate({
      endpoint: `/requests/admin/${id}/complete-return`,
      method: 'put',
      payload: {},
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Back and Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/requests')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Requests
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">Current Status:</span>
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-900 text-white uppercase tracking-wider">
            {(request.status || 'SUBMITTED').replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Device & Valuation Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {request.requestNumber}
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
                  {request.deviceDetails?.brandName} {request.deviceDetails?.modelName}
                </h2>
                <span className="inline-block px-2 py-0.5 mt-1 text-xs font-semibold rounded bg-slate-100 text-slate-700">
                  Storage: {request.deviceDetails?.storageCapacity || 'Standard'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Indicative Estimate
                </span>
                <span className="text-2xl font-black text-revoo-700 font-mono">
                  ₹{request.indicativeEstimate?.estimatedAmount?.toLocaleString('en-IN') || 0}
                </span>
              </div>
            </div>

            {/* Condition Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Display</span>
                <span className="font-semibold text-slate-800">
                  {(
                    request.declaredCondition?.displayCondition ||
                    request.declaredCondition?.screenDisplayCondition ||
                    'Good / Working'
                  ).replace(/_/g, ' ')}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Body / Frame</span>
                <span className="font-semibold text-slate-800">
                  {(
                    request.declaredCondition?.bodyCondition ||
                    request.declaredCondition?.backPanelCondition ||
                    'Flawless / Normal'
                  ).replace(/_/g, ' ')}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Battery</span>
                <span className="font-semibold text-slate-800">
                  {request.declaredCondition?.batteryHealth || 'Healthy (85%+)'}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Original Kit</span>
                <span className="font-semibold text-slate-800">
                  {request.declaredCondition?.hasOriginalBox ? 'Box ✓ ' : 'No Box '}
                  {request.declaredCondition?.hasOriginalCharger ? '| Charger ✓' : ''}
                </span>
              </div>
            </div>

            {/* Estimate breakdown */}
            {request.indicativeEstimate?.breakdown && request.indicativeEstimate.breakdown.length > 0 && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 border border-slate-200/60">
                <span className="font-bold text-slate-700 block">Valuation Breakdown:</span>
                {request.indicativeEstimate.breakdown.map((b, idx) => (
                  <div key={idx} className="flex justify-between text-slate-600">
                    <span>{b.component} ({b.description})</span>
                    <span className={b.adjustment < 0 ? 'text-red-600 font-mono font-medium' : 'text-green-700 font-mono font-medium'}>
                      {b.adjustment > 0 ? `+₹${b.adjustment}` : `-₹${Math.abs(b.adjustment)}`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* DOFY Condition Assessment Summary */}
            {request.declaredCondition?.summary && request.declaredCondition.summary.length > 0 && (
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <span className="font-bold text-slate-800 text-xs block">Customer Condition Assessment (DOFY):</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {request.declaredCondition.summary.map((g: any, i: number) => (
                    <div key={i} className="bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-xs">
                      <p className="font-bold text-slate-700 text-[11px] mb-1">{g.title}:</p>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-600 text-[11px]">
                        {g.items?.map((item: string, j: number) => (
                          <li key={j}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Customer Declared Photos */}
          {request.photoUrls && request.photoUrls.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Customer Device Photographs</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {request.photoUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="group block relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
                  >
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Physical Inspection Dossier (if done) */}
          {request.inspectionId && (
            <div className="bg-white rounded-xl border border-purple-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-purple-600" />
                  <h3 className="text-base font-bold text-slate-900">Physical Inspection Report</h3>
                </div>
                <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                  Inspector: {request.inspectionId.inspectorName}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                  <span className="font-bold text-purple-900 block mb-1">Inspector Suggested Valuation:</span>
                  <span className="text-lg font-extrabold text-purple-700 font-mono">
                    ₹{request.inspectionId.suggestedOfferAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                {request.inspectionId.discrepancies?.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">Discrepancies vs Declared:</span>
                    <ul className="list-disc pl-5 text-slate-600 space-y-0.5">
                      {request.inspectionId.discrepancies.map((d: string, i: number) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {request.inspectionId.customerVisibleNotes && (
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">Customer Visible Notes:</span>
                    <p className="text-slate-600 italic">"{request.inspectionId.customerVisibleNotes}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Final Offer & Decision */}
          {request.activeOfferId && (
            <div className="bg-white rounded-xl border border-amber-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-slate-900">Final Offer (v{request.activeOfferId.offerVersion})</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  {request.activeOfferId.status}
                </span>
              </div>
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-xs text-slate-500">Confirmed Purchase Offer:</span>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  ₹{request.activeOfferId.finalOfferedAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-xs text-slate-600 bg-amber-50/50 p-2.5 rounded border border-amber-100">
                <strong>Explanation:</strong> {request.activeOfferId.valuationExplanation}
              </p>
            </div>
          )}

          {/* Completed Payment Record */}
          {request.paymentId && (
            <div className="bg-white rounded-xl border border-emerald-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Payment Completed</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Amount Paid:</span>
                  <span className="font-extrabold text-emerald-700 text-lg font-mono">
                    ₹{request.paymentId.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Payment Method:</span>
                  <span className="font-semibold text-slate-800">{request.paymentId.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Reference ID:</span>
                  <span className="font-mono text-slate-800 font-semibold">{request.paymentId.paymentReference}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Payment Date:</span>
                  <span className="text-slate-600">{new Date(request.paymentId.paidAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Customer details, Actions & Timeline */}
        <div className="space-y-6">
          {/* Customer & Address Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-500" /> Customer Information
            </h3>
            <div className="space-y-1 text-slate-700">
              <p className="font-semibold text-slate-900">{request.customerDetails?.fullName || 'Customer'}</p>
              <p className="flex items-center gap-1 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {request.customerDetails?.phone || 'N/A'}
              </p>
              {request.customerDetails?.email && <p className="text-slate-500">{request.customerDetails.email}</p>}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" /> Pickup Address
              </span>
              <p className="text-slate-800 leading-relaxed font-medium">
                {request.pickupAddress?.street || 'Doorstep Address'}, {request.pickupAddress?.city || ''},{' '}
                {request.pickupAddress?.state || ''} - {request.pickupAddress?.pincode || ''}
              </p>
              {request.pickupAddress?.landmark && (
                <p className="text-slate-500 mt-0.5">Landmark: {request.pickupAddress.landmark}</p>
              )}
            </div>
          </div>

          {/* Operational Action Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Operational Actions</h3>

            {/* Action 1: Assign Collection */}
            {request.status === 'SUBMITTED' && (
              <button
                onClick={() => setActiveModal('ASSIGN_COLLECTION')}
                className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Truck className="w-4 h-4" /> Assign Collection Staff
              </button>
            )}

            {/* Action 2: Collection Progress */}
            {request.status === 'ASSIGNED_FOR_COLLECTION' && (
              <div className="space-y-2">
                <button
                  onClick={() => handleUpdateCollectionStatus('COLLECTED')}
                  className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Mark Device Collected
                </button>
              </div>
            )}

            {/* Action 3: Mark Received at Hub */}
            {request.status === 'COLLECTED' && (
              <button
                onClick={() => handleUpdateCollectionStatus('RECEIVED_AT_INSPECTION_CENTRE')}
                className="w-full py-2.5 px-3 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Check-in at Inspection Hub
              </button>
            )}

            {/* Action 4: Physical Inspection */}
            {(request.status === 'RECEIVED_AT_INSPECTION_CENTRE' || request.status === 'UNDER_INSPECTION') && (
              <button
                onClick={() => setActiveModal('INSPECTION')}
                className="w-full py-2.5 px-3 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Search className="w-4 h-4" /> Complete Physical Inspection
              </button>
            )}

            {/* Action 5: Final Offer */}
            {request.status === 'UNDER_INSPECTION' && (
              <button
                onClick={() => setActiveModal('FINAL_OFFER')}
                className="w-full py-2.5 px-3 bg-revoo-700 hover:bg-revoo-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4" /> Generate Final Offer
              </button>
            )}

            {/* Action 6: Record Payment */}
            {request.status === 'OFFER_ACCEPTED' && (
              <button
                onClick={() => setActiveModal('RECORD_PAYMENT')}
                className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" /> Record Customer Payment
              </button>
            )}

            {/* Action 7: Initiate Return */}
            {request.status === 'OFFER_REJECTED' && (
              <button
                onClick={() => setActiveModal('INITIATE_RETURN')}
                className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" /> Arrange Device Return
              </button>
            )}

            {request.status === 'RETURN_INITIATED' && (
              <button
                onClick={handleCompleteReturn}
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Mark Device Returned
              </button>
            )}

            {request.status === 'PAYMENT_COMPLETED' && (
              <div className="p-3 bg-green-50 rounded-lg text-xs text-green-800 font-semibold text-center border border-green-200">
                Transaction Completed Successfully
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" /> Audit Timeline
            </h3>
            <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {request.timeline?.map((item, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white"></div>
                  <span className="font-bold text-slate-800 block">{(item.status || 'STATUS_UPDATE').replace(/_/g, ' ')}</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">{item.note}</p>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {new Date(item.timestamp).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    • By {item.updatedBy || 'System'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Modal: Assign Collection */}
      {activeModal === 'ASSIGN_COLLECTION' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-600" /> Assign Collection Personnel
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Customer Pickup: <strong className="text-slate-800">{request.pickupAddress?.pincode || 'Tamil Nadu'}</strong> • {request.pickupAddress?.city || request.pickupAddress?.state || 'Local Hub'}
                </p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Smart Recommendations Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Recommended Staff for this Area
                  </label>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Live Distance Match
                  </span>
                </div>

                {isStaffLoading ? (
                  <div className="py-4 text-center text-xs text-slate-400">Finding nearby partners...</div>
                ) : staffRecommendations.length === 0 ? (
                  <div className="py-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                    No exact match found. Please choose an active partner below.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {staffRecommendations.slice(0, 4).map((emp: any) => {
                      const isSelected = collectionStaff === emp.fullName || selectedStaffId === emp._id;
                      return (
                        <div
                          key={emp._id}
                          onClick={() => {
                            setSelectedStaffId(emp._id);
                            setCollectionStaff(emp.fullName);
                            setCollectionNotes(
                              `Assigned to ${emp.fullName} (${emp.district} Hub - ${emp.phone}) for doorstep pickup`
                            );
                          }}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-50/80 border-amber-500 shadow-sm ring-1 ring-amber-500'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="font-bold text-slate-900 truncate">{emp.fullName}</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
                                {emp.employeeCode}
                              </span>
                              <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                                {emp.matchBadge}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <span>📍 {emp.district} Hub</span>
                              <span>•</span>
                              <span>📞 {emp.phone}</span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                {emp.rating?.toFixed(1) || '5.0'}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Staff Selector / Manual Override */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Selected Collection Staff</label>
                <input
                  type="text"
                  value={collectionStaff}
                  onChange={(e) => setCollectionStaff(e.target.value)}
                  placeholder="Enter or select executive name"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Pickup Date & Slot */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Scheduled Pickup Date</label>
                  <input
                    type="date"
                    value={collectionDate}
                    onChange={(e) => setCollectionDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Time Window</label>
                  <select
                    value={collectionSlot}
                    onChange={(e) => setCollectionSlot(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 bg-slate-50"
                  >
                    <option>Morning (10:00 AM - 01:00 PM)</option>
                    <option>Afternoon (02:00 PM - 05:00 PM)</option>
                    <option>Evening (05:00 PM - 08:00 PM)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Logistics Notes</label>
                <textarea
                  value={collectionNotes}
                  onChange={(e) => setCollectionNotes(e.target.value)}
                  placeholder="Call customer 30 minutes before arrival"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 bg-slate-50"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignCollection}
                disabled={mutation.isPending || !collectionStaff.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-colors"
              >
                {mutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Physical Inspection */}
      {activeModal === 'INSPECTION' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 my-8">
            <h3 className="text-base font-bold text-slate-900">Physical Diagnostic Inspection</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Actual Screen Condition</label>
                <select
                  value={inspDisplay}
                  onChange={(e) => setInspDisplay(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                >
                  <option value="FLAWLESS">FLAWLESS</option>
                  <option value="MINOR_SCRATCHES">MINOR_SCRATCHES</option>
                  <option value="DEEP_SCRATCHES">DEEP_SCRATCHES</option>
                  <option value="CRACKED_GLASS">CRACKED_GLASS</option>
                  <option value="BROKEN_OR_DEAD_PIXELS">BROKEN_OR_DEAD_PIXELS</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Actual Body Condition</label>
                <select
                  value={inspBody}
                  onChange={(e) => setInspBody(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                >
                  <option value="FLAWLESS">FLAWLESS</option>
                  <option value="MINOR_SIGNS_OF_USE">MINOR_SIGNS_OF_USE</option>
                  <option value="DENTED_OR_SCRATCHED">DENTED_OR_SCRATCHED</option>
                  <option value="BENT_OR_CRACKED_BACK">BENT_OR_CRACKED_BACK</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <span className="block text-xs font-semibold text-slate-700">Hardware Functional Checklist</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={screenFunctional}
                    onChange={(e) => setScreenFunctional(e.target.checked)}
                  />
                  <span>Display Panels Operational</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={touchFunctional}
                    onChange={(e) => setTouchFunctional(e.target.checked)}
                  />
                  <span>Digitizer / Touch Responsive</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={camerasFunctional}
                    onChange={(e) => setCamerasFunctional(e.target.checked)}
                  />
                  <span>Cameras Functional</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={biometricsFunctional}
                    onChange={(e) => setBiometricsFunctional(e.target.checked)}
                  />
                  <span>Biometrics (Face/Fingerprint)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Condition Discrepancies (One per line)
              </label>
              <textarea
                value={discrepancyText}
                onChange={(e) => setDiscrepancyText(e.target.value)}
                placeholder="e.g. Scratched bottom chassis not declared by customer&#10;Battery health is 79% (Degraded)"
                className="w-full p-2 border border-slate-300 rounded text-xs"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Suggested Valuation Offer (₹)
              </label>
              <input
                type="number"
                value={suggestedOffer}
                onChange={(e) => setSuggestedOffer(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Visible Explanation
              </label>
              <input
                type="text"
                value={customerVisibleNotes}
                onChange={(e) => setCustomerVisibleNotes(e.target.value)}
                placeholder="Screen verified. Minor hairline scuffs found on frame."
                className="w-full p-2 border border-slate-300 rounded text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitInspection}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded"
              >
                Submit Inspection Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Final Offer */}
      {activeModal === 'FINAL_OFFER' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Issue Confirmed Final Offer</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Final Confirmed Offer Amount (₹)
              </label>
              <input
                type="number"
                value={finalOfferAmount}
                onChange={(e) => setFinalOfferAmount(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded text-xs font-mono font-bold text-lg text-revoo-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer-Facing Offer Rationale
              </label>
              <textarea
                value={offerExplanation}
                onChange={(e) => setOfferExplanation(e.target.value)}
                placeholder="Offer based on physical diagnosis: screen and touch in excellent condition; minor cosmetic wear on bezel."
                className="w-full p-2 border border-slate-300 rounded text-xs"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateFinalOffer}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-revoo-700 hover:bg-revoo-800 rounded"
              >
                Issue Final Offer to Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal: Record Payment */}
      {activeModal === 'RECORD_PAYMENT' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Record Buyback Payment</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payout Amount (₹)</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Disbursement Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-xs"
              >
                <option value="UPI">UPI Instant Transfer</option>
                <option value="BANK_TRANSFER">Direct Bank NEFT/IMPS</option>
                <option value="CASH">Cash on Inspection</option>
                <option value="CHEQUE">Corporate Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction Reference ID / UTR
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. UPI/2026/8947289172 or NEFT-8912"
                className="w-full p-2 border border-slate-300 rounded text-xs font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded"
              >
                Confirm Payment & Complete Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Initiate Return */}
      {activeModal === 'INITIATE_RETURN' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Initiate Rejected Device Return</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Return Courier / Staff Name</label>
              <input
                type="text"
                value={returnStaff}
                onChange={(e) => setReturnStaff(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Return Waybill / Tracking ID</label>
              <input
                type="text"
                value={returnTracking}
                onChange={(e) => setReturnTracking(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Logistics Notes</label>
              <textarea
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Device safely boxed with original accessories for return handover."
                className="w-full p-2 border border-slate-300 rounded text-xs"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleInitiateReturn}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded"
              >
                Confirm Return Initiation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
