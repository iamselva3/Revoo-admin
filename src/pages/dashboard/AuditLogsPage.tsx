import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Clock, User, Filter } from 'lucide-react';
import { apiClient } from '../../api/client';

export const AuditLogsPage: React.FC = () => {
  const { data: logs, isLoading } = useQuery<any[]>({
    queryKey: ['admin-audits'],
    queryFn: async () => (await apiClient.get('/dashboard/audits')).data.data,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-1">
          Immutable compliance log of administrative actions, pricing adjustments, and transaction updates.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-6 py-3.5">Timestamp</th>
              <th className="px-6 py-3.5">Actor</th>
              <th className="px-6 py-3.5">Action</th>
              <th className="px-6 py-3.5">Resource</th>
              <th className="px-6 py-3.5">Metadata / Diff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-4 bg-slate-50/50"></td>
                </tr>
              ))
            ) : !logs || logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  No audit logs recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-semibold text-slate-900">{log.actorEmail || 'System'}</span>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">{log.actorType}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-700 font-medium">
                    {log.resourceType}
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 font-mono text-[11px] max-w-xs truncate">
                    {JSON.stringify(log.diff || {})}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

