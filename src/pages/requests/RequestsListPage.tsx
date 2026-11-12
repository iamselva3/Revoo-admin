import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, ChevronRight, Inbox, Eye } from 'lucide-react';
import { apiClient } from '../../api/client';
import { BuybackRequest, RequestStatus } from '../../types';

export const RequestsListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const activeStatus = searchParams.get('status') || '';

  const { data, isLoading } = useQuery<{
    data: BuybackRequest[];
    meta: { total: number; page: number; totalPages: number };
  }>({
    queryKey: ['admin-requests', activeStatus, searchQuery],
    queryFn: async () => {
      const params: any = {};
      if (activeStatus) params.status = activeStatus;
      if (searchQuery) params.search = searchQuery;
      const res = await apiClient.get('/requests/admin', { params });
      return res.data;
    },
  });

  const statuses = [
    { label: 'All Requests', value: '' },
    { label: 'Submitted', value: 'SUBMITTED' },
    { label: 'Assigned Collection', value: 'ASSIGNED_FOR_COLLECTION' },
    { label: 'Collected', value: 'COLLECTED' },
    { label: 'Under Inspection', value: 'UNDER_INSPECTION' },
    { label: 'Awaiting Decision', value: 'AWAITING_CUSTOMER_DECISION' },
    { label: 'Offer Accepted', value: 'OFFER_ACCEPTED' },
    { label: 'Offer Rejected', value: 'OFFER_REJECTED' },
    { label: 'Completed', value: 'PAYMENT_COMPLETED' },
    { label: 'Return Initiated', value: 'RETURN_INITIATED' },
  ];

  const handleStatusChange = (status: string) => {
    if (status) {
      searchParams.set('status', status);
    } else {
      searchParams.delete('status');
    }
    setSearchParams(searchParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      searchParams.set('search', searchQuery);
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams);
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ASSIGNED_FOR_COLLECTION':
      case 'COLLECTION_SCHEDULED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'COLLECTED':
      case 'RECEIVED_AT_INSPECTION_CENTRE':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'UNDER_INSPECTION':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'AWAITING_CUSTOMER_DECISION':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'OFFER_ACCEPTED':
      case 'PAYMENT_PROCESSING':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PAYMENT_COMPLETED':
        return 'bg-green-100 text-green-800 border-green-300 font-bold';
      case 'OFFER_REJECTED':
      case 'RETURN_INITIATED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'RETURNED':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Buyback Request Inbox</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage customer trade-ins, collection schedules, and physical inspection workflows.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search request #, customer, phone..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-revoo-700"
          />
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {statuses.map((s) => (
          <button
            key={s.value}
            onClick={() => handleStatusChange(s.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeStatus === s.value
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Request Number</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Device</th>
                <th className="px-6 py-3.5">Condition Declared</th>
                <th className="px-6 py-3.5">Indicative Valuation</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Submitted On</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="px-6 py-4 bg-slate-50/50"></td>
                  </tr>
                ))
              ) : !data?.data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <Inbox className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No buyback requests matching your filters.
                  </td>
                </tr>
              ) : (
                data.data.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 font-mono">
                      {req.requestNumber ? req.requestNumber.replace(/^REV-/i, 'GENIE-') : ''}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{req.customerDetails?.fullName || 'Customer'}</div>
                      <div className="text-[11px] text-slate-500">{req.customerDetails?.phone || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {req.deviceDetails?.brandName} {req.deviceDetails?.modelName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {req.deviceDetails?.storageCapacity || 'Standard'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] text-slate-700">
                        Screen:{' '}
                        {(
                          req.declaredCondition?.displayCondition ||
                          req.declaredCondition?.screenDisplayCondition ||
                          'Good'
                        ).replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-revoo-700 font-mono text-sm">
                      ₹{req.indicativeEstimate?.estimatedAmount?.toLocaleString('en-IN') || 0}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${getStatusBadge(
                          req.status
                        )}`}
                      >
                        {(req.status || 'SUBMITTED').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(req.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/requests/${req._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
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

