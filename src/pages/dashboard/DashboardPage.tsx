import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Inbox,
  Clock,
  Truck,
  CheckCircle2,
  Search,
  Check,
  XCircle,
  CreditCard,
  RotateCcw,
  AlertCircle,
  ArrowUpRight,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { DashboardMetrics, BuybackRequest } from '../../types';

export const DashboardPage: React.FC = () => {
  const { data, isLoading, error } = useQuery<{
    metrics: DashboardMetrics;
    recentRequests: BuybackRequest[];
  }>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/stats');
      return res.data.data;
    },
    refetchInterval: 15000, // Live poll every 15s
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>Failed to load operational analytics. Please ensure backend is running.</span>
      </div>
    );
  }

  const { metrics, recentRequests } = data;

  const statCards = [
    {
      title: 'Total Requests',
      value: metrics.totalRequests,
      icon: Inbox,
      color: 'bg-slate-900 text-white',
      filter: '',
    },
    {
      title: 'New Submissions',
      value: metrics.newRequests,
      icon: Clock,
      color: 'bg-blue-600 text-white',
      filter: 'SUBMITTED',
    },
    {
      title: 'Pending Collection',
      value: metrics.collectionPending,
      icon: Truck,
      color: 'bg-amber-600 text-white',
      filter: 'ASSIGNED_FOR_COLLECTION',
    },
    {
      title: 'Devices Collected',
      value: metrics.devicesCollected,
      icon: CheckCircle2,
      color: 'bg-indigo-600 text-white',
      filter: 'COLLECTED',
    },
    {
      title: 'Under Inspection',
      value: metrics.inspectionsPending,
      icon: Search,
      color: 'bg-purple-600 text-white',
      filter: 'UNDER_INSPECTION',
    },
    {
      title: 'Awaiting Decision',
      value: metrics.awaitingCustomerDecision,
      icon: Clock,
      color: 'bg-yellow-600 text-white',
      filter: 'AWAITING_CUSTOMER_DECISION',
    },
    {
      title: 'Offers Accepted',
      value: metrics.acceptedOffers,
      icon: Check,
      color: 'bg-revoo-700 text-white',
      filter: 'OFFER_ACCEPTED',
    },
    {
      title: 'Offers Rejected',
      value: metrics.rejectedOffers,
      icon: XCircle,
      color: 'bg-rose-600 text-white',
      filter: 'OFFER_REJECTED',
    },
    {
      title: 'Payments Pending',
      value: metrics.paymentsPending,
      icon: CreditCard,
      color: 'bg-emerald-700 text-white',
      filter: 'PAYMENT_PROCESSING',
    },
    {
      title: 'Completed Orders',
      value: metrics.completedTransactions,
      icon: CheckCircle2,
      color: 'bg-emerald-600 text-white',
      filter: 'PAYMENT_COMPLETED',
    },
    {
      title: 'Returns Pending',
      value: metrics.returnsPending,
      icon: RotateCcw,
      color: 'bg-orange-600 text-white',
      filter: 'RETURN_INITIATED',
    },
    {
      title: 'Open Inquiries',
      value: metrics.openEnquiries,
      icon: AlertCircle,
      color: 'bg-slate-700 text-white',
      link: '/enquiries',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operations Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Live buyback funnel metrics, physical inspection pipeline, and payout statuses.
        </p>
      </div>

      {/* Operational Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          const href = card.link || (card.filter ? `/requests?status=${card.filter}` : '/requests');
          return (
            <Link
              key={idx}
              to={href}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm transition hover:shadow group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-900">{card.value}</span>
                <span className="text-xs font-medium text-slate-400 group-hover:text-revoo-700 flex items-center">
                  View <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recent Buyback Requests</h2>
          <Link
            to="/requests"
            className="text-xs font-semibold text-revoo-700 hover:text-revoo-800 flex items-center gap-1"
          >
            View All Requests <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Request ID</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Device Model</th>
                <th className="px-6 py-3">Indicative Estimate</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No buyback requests received yet.
                  </td>
                </tr>
              ) : (
                recentRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-900 font-mono">
                      {req.requestNumber ? req.requestNumber.replace(/^REV-/i, 'GENIE-') : ''}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-medium text-slate-800">{req.customerDetails?.fullName || 'Customer'}</div>
                      <div className="text-[11px] text-slate-500">{req.customerDetails?.phone || ''}</div>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-900">
                      {req.deviceDetails?.brandName} {req.deviceDetails?.modelName}
                      <span className="ml-1 text-[11px] text-slate-500 font-normal">
                        ({req.deviceDetails?.storageCapacity || 'Standard'})
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-revoo-700 font-mono">
                      ₹{req.indicativeEstimate?.estimatedAmount?.toLocaleString('en-IN') || 0}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {(req.status || 'SUBMITTED').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {new Date(req.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        to={`/requests/${req._id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-revoo-700 hover:bg-revoo-50 rounded-md border border-revoo-200 transition"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

