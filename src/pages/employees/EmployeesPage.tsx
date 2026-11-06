import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  Plus,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Star,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Filter,
  Navigation,
  Bike,
  Car,
  X,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '../../api/client';

export interface Employee {
  _id: string;
  fullName: string;
  employeeCode: string;
  phone: string;
  email: string;
  state: string;
  district: string;
  assignedPincodes: string[];
  role: 'PICKUP_PARTNER' | 'FIELD_INSPECTOR' | 'LOGISTICS_LEAD';
  groupName?: string;
  status: 'ACTIVE' | 'ON_DUTY' | 'INACTIVE';
  vehicleType: 'BIKE' | 'VAN' | 'ELECTRIC_SCOOTER';
  completedPickups: number;
  rating: number;
  createdAt: string;
}

export const EmployeesPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('Virudhunagar');
  const [assignedPincodes, setAssignedPincodes] = useState('');
  const [role, setRole] = useState<'PICKUP_PARTNER' | 'FIELD_INSPECTOR' | 'LOGISTICS_LEAD'>('PICKUP_PARTNER');
  const [status, setStatus] = useState<'ACTIVE' | 'ON_DUTY' | 'INACTIVE'>('ACTIVE');
  const [vehicleType, setVehicleType] = useState<'BIKE' | 'VAN' | 'ELECTRIC_SCOOTER'>('BIKE');

  // Fetch employees
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['employees', searchQuery, selectedDistrict, selectedStatus],
    queryFn: async () => {
      const res = await apiClient.get('/employees', {
        params: {
          q: searchQuery.trim() || undefined,
          district: selectedDistrict !== 'ALL' ? selectedDistrict : undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        },
      });
      return res.data;
    },
  });

  const employees: Employee[] = data?.data || [];
  const stats = data?.stats || { total: 0, active: 0, districtsCovered: 0 };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return (await apiClient.post('/employees', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowAddModal(false);
      resetForm();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return (await apiClient.put(`/employees/${id}`, payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setEditingEmployee(null);
      resetForm();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await apiClient.delete(`/employees/${id}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setDistrict('Virudhunagar');
    setAssignedPincodes('');
    setRole('PICKUP_PARTNER');
    setStatus('ACTIVE');
    setVehicleType('BIKE');
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFullName(emp.fullName);
    setPhone(emp.phone);
    setEmail(emp.email);
    setDistrict(emp.district);
    setAssignedPincodes(emp.assignedPincodes.join(', '));
    setRole(emp.role);
    setStatus(emp.status);
    setVehicleType(emp.vehicleType);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pincodeArray = assignedPincodes
      .split(',')
      .map((p) => p.trim())
      .filter((p) => /^\d{6}$/.test(p));

    const payload = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      district: district.trim(),
      state: 'Tamil Nadu',
      assignedPincodes: pincodeArray,
      role,
      status,
      vehicleType,
    };

    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee._id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const tamilNaduDistricts = [
    'ALL',
    'Virudhunagar',
    'Chennai',
    'Coimbatore',
    'Madurai',
    'Tiruchirappalli',
    'Salem',
    'Tirunelveli',
    'Erode',
    'Vellore',
    'Thanjavur',
    'Dindigul',
    'Kanchipuram',
    'Chengalpattu',
    'Tiruppur',
    'Cuddalore',
    'Karur',
    'Theni',
    'Thoothukudi',
    'Kanyakumari',
    'Sivaganga',
    'Ramanathapuram',
    'Namakkal',
    'Dharmapuri',
    'Krishnagiri',
    'Villupuram',
    'Tiruvannamalai',
    'Nagapattinam',
    'Tiruvarur',
    'Pudukkottai',
    'Ariyalur',
    'Perambalur',
    'Nilgiris',
    'Ranipet',
    'Tirupattur',
    'Kallakurichi',
    'Tenkasi',
    'Mayiladuthurai',
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Collection Staff & Field Partners
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage 100+ doorstep inspection & pickup executives across all 38 districts of Tamil Nadu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Field Partner
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Staff</span>
            <span className="text-2xl font-black text-slate-900">{stats.total || employees.length}</span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Pre-seeded across TN</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Active On Duty</span>
            <span className="text-2xl font-black text-slate-900">{stats.active || employees.filter(e => e.status !== 'INACTIVE').length}</span>
            <span className="text-[10px] text-teal-600 font-bold block mt-0.5">Ready for instant pickup</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Districts Covered</span>
            <span className="text-2xl font-black text-slate-900">38 Districts</span>
            <span className="text-[10px] text-indigo-600 font-bold block mt-0.5">100% Tamil Nadu Coverage</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by executive name, phone, code (e.g. REV-TN-001) or PIN code (626125)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* District select */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              {tamilNaduDistricts.map((d) => (
                <option key={d} value={d}>
                  {d === 'ALL' ? 'All 38 Districts' : d}
                </option>
              ))}
            </select>
          </div>

          {/* Status select */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_DUTY">On Duty</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff List Grid */}
      {isLoading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading field collection partners...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No field partners found</h3>
          <p className="text-xs text-slate-400 mt-1">Try modifying your search query or district filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => {
            const isVirudhunagar = emp.district === 'Virudhunagar';
            return (
              <div
                key={emp._id}
                className={`bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                  isVirudhunagar ? 'border-emerald-300 ring-1 ring-emerald-500/10' : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Top Bar: Code, Status & Vehicle */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {emp.employeeCode}
                      </span>
                      {isVirudhunagar && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Srivilliputhur Hub
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        emp.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : emp.status === 'ON_DUTY'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </div>

                  {/* Name & Role */}
                  <div className="flex items-start justify-between gap-2 mt-1">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{emp.fullName}</h3>
                      <span className="text-[11px] text-slate-500 font-medium block">
                        {emp.groupName || `${emp.district} Regional Squad`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex-shrink-0">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-[11px] font-black text-amber-800">{emp.rating?.toFixed(1) || '5.0'}</span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold">{emp.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        <strong className="text-slate-800">{emp.district}</strong>, {emp.state}
                      </span>
                    </div>
                  </div>

                  {/* Assigned PIN Codes */}
                  <div className="mt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Assigned PIN Codes ({emp.assignedPincodes?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(emp.assignedPincodes || []).slice(0, 5).map((pin) => (
                        <span
                          key={pin}
                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200"
                        >
                          {pin}
                        </span>
                      ))}
                      {(emp.assignedPincodes?.length || 0) > 5 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                          +{emp.assignedPincodes.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer: Completed Pickups & Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-semibold text-slate-700">{emp.completedPickups || 0}</span> pickups done
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(emp)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Edit Partner"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${emp.fullName} from pickup partners?`)) {
                          deleteMutation.mutate(emp._id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Partner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Partner Modal */}
      {(showAddModal || editingEmployee) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Users className="w-4 h-4" />
                </span>
                <h2 className="text-base font-extrabold text-slate-900">
                  {editingEmployee ? `Edit ${editingEmployee.fullName}` : 'Add Field Collection Partner'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingEmployee(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. M. Senthil Murugan"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98421 XXXXX"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    District *
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {tamilNaduDistricts.filter(d => d !== 'ALL').map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned PIN Codes (comma separated)
                </label>
                <input
                  type="text"
                  value={assignedPincodes}
                  onChange={(e) => setAssignedPincodes(e.target.value)}
                  placeholder="e.g. 626125, 626117, 626123, 626001"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Requests with matching PIN codes will automatically recommend this partner with top priority.
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="PICKUP_PARTNER">Pickup Partner</option>
                    <option value="FIELD_INSPECTOR">Field Inspector</option>
                    <option value="LOGISTICS_LEAD">Logistics Lead</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="ON_DUTY">On Duty</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Vehicle</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="BIKE">Bike</option>
                    <option value="ELECTRIC_SCOOTER">Electric Scooter</option>
                    <option value="VAN">Van</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingEmployee(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingEmployee
                    ? 'Save Changes'
                    : 'Create Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

