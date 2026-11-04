import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HelpCircle, MessageSquare, CheckCircle, Mail, Phone } from 'lucide-react';
import { apiClient } from '../../api/client';

export const EnquiriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [adminResponse, setAdminResponse] = useState('');

  const { data: enquiries, isLoading } = useQuery<any[]>({
    queryKey: ['admin-enquiries'],
    queryFn: async () => (await apiClient.get('/enquiries/admin')).data.data,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      return (await apiClient.put(`/enquiries/admin/${id}/respond`, { adminResponse: response, status: 'RESOLVED' })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-enquiries'] });
      setSelectedTicket(null);
      setAdminResponse('');
    },
  });

  const handleRespond = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    respondMutation.mutate({ id: selectedTicket._id, response: adminResponse });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Support & Inquiries</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review customer questions, valuation inquiries, and return follow-ups.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-6 py-3.5">Ticket #</th>
              <th className="px-6 py-3.5">Customer</th>
              <th className="px-6 py-3.5">Subject</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5">Received Date</th>
              <th className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="px-6 py-4 bg-slate-50/50"></td>
                </tr>
              ))
            ) : !enquiries || enquiries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  No support tickets found.
                </td>
              </tr>
            ) : (
              enquiries.map((enq) => (
                <tr key={enq._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">{enq.ticketNumber}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{enq.name}</div>
                    <div className="text-[11px] text-slate-500">{enq.email}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">{enq.subject}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                        enq.status === 'RESOLVED'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {enq.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(enq.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedTicket(enq);
                        setAdminResponse(enq.adminResponse || '');
                      }}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded text-xs"
                    >
                      View & Reply
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleRespond} className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs text-slate-400 font-bold">{selectedTicket.ticketNumber}</span>
                <h3 className="text-base font-bold text-slate-900">{selectedTicket.subject}</h3>
                <span className="text-xs text-slate-500">From {selectedTicket.name} ({selectedTicket.email})</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-800 whitespace-pre-wrap border border-slate-200/60">
              {selectedTicket.message}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Response / Resolution Note
              </label>
              <textarea
                required
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Type your official response..."
                className="w-full p-2.5 border border-slate-300 rounded text-xs"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={respondMutation.isPending}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-revoo-700 hover:bg-revoo-800 rounded"
              >
                Save & Resolve Ticket
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

