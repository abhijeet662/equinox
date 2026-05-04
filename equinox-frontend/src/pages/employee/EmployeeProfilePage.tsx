import React, { useRef, useState } from 'react';
import { User, FileText, CreditCard, Upload, Trash2, Eye, Download, Plus, X, CheckCircle } from 'lucide-react';
import { useAppSelector } from '../../hooks/useAppSelector';
import Avatar from '../../components/ui/Avatar';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'documents' | 'bank';

interface UploadedDoc { id: string; name: string; size: string; type: string; uploadedAt: string; }

const DOC_TYPES = ['ID Proof', 'Address Proof', 'Educational Certificate', 'Experience Letter', 'NDA / Contract', 'Other'];

const EmployeeProfilePage: React.FC = () => {
  const { user } = useAppSelector(s => s.auth);
  const [tab, setTab] = useState<Tab>('profile');
  const [docs, setDocs]   = useState<UploadedDoc[]>([
    { id: 'd1', name: 'National_ID.pdf', size: '1.2 MB', type: 'ID Proof', uploadedAt: '2025-11-10' },
    { id: 'd2', name: 'Degree_Certificate.pdf', size: '3.4 MB', type: 'Educational Certificate', uploadedAt: '2025-11-10' },
  ]);
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const fileRef  = useRef<HTMLInputElement>(null);
  const [bankForm, setBankForm] = useState({
    accountHolder: user?.name || '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    accountType: 'Savings',
    swiftCode: '',
  });
  const [bankSaved, setBankSaved] = useState(false);

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newDocs = Array.from(e.target.files).map(f => ({
      id: `d-${Date.now()}-${Math.random()}`,
      name: f.name,
      size: f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`,
      type: docType,
      uploadedAt: new Date().toISOString().split('T')[0],
    }));
    setDocs(prev => [...prev, ...newDocs]);
    toast.success(`${newDocs.length} document(s) uploaded`);
    e.target.value = '';
  };

  const removeDoc = (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    toast.success('Document removed');
  };

  const handleBankSave = (e: React.FormEvent) => {
    e.preventDefault();
    setBankSaved(true);
    toast.success('Bank details saved securely');
  };

  const tabs = [
    { key: 'profile' as Tab,   label: 'Profile',    icon: <User size={15} /> },
    { key: 'documents' as Tab, label: 'Documents',  icon: <FileText size={15} /> },
    { key: 'bank' as Tab,      label: 'Bank Details', icon: <CreditCard size={15} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">My Profile</h1>
        <p className="text-surface-500 text-sm mt-0.5">Manage your personal information, documents and bank details.</p>
      </div>

      {/* Avatar + name banner */}
      <div className="card bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold flex-shrink-0">
          {user?.avatar ? (
            <Avatar initials={user.avatar} src={user.avatar.startsWith('data:') ? user.avatar : undefined} size="xl" />
          ) : (
            <span>{(user?.name || 'E')[0]}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold">{user?.name || 'Employee'}</p>
          <p className="text-amber-100 text-sm">{user?.email}</p>
          {user?.company && <p className="text-amber-200 text-xs mt-0.5">{user.company}</p>}
        </div>
        <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-xl">Employee</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 rounded-xl w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white shadow-sm text-primary-600' : 'text-surface-500 hover:text-surface-800'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="card space-y-5">
          <h2 className="font-semibold text-surface-800">Personal Information</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-medium text-surface-500 mb-1 block">Full Name</label>
              <p className="text-surface-900 font-medium">{user?.name || '—'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-surface-500 mb-1 block">Email Address</label>
              <p className="text-surface-900 font-medium">{user?.email || '—'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-surface-500 mb-1 block">Phone</label>
              <p className="text-surface-900 font-medium">{(user as Record<string, unknown>)?.phone as string || '—'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-surface-500 mb-1 block">Company</label>
              <p className="text-surface-900 font-medium">{user?.company || '—'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-surface-500 mb-1 block">Role</label>
              <p className="text-surface-900 font-medium capitalize">{user?.role?.toLowerCase() || '—'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-surface-500 mb-1 block">Status</label>
              <span className="badge bg-green-100 text-green-700 capitalize">{(user as Record<string, unknown>)?.status as string || 'Active'}</span>
            </div>
          </div>
          <div className="pt-3 border-t border-surface-100">
            <p className="text-xs text-surface-400">To update your profile details, go to <strong>Settings</strong>.</p>
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {tab === 'documents' && (
        <div className="space-y-4">
          {/* Upload section */}
          <div className="card">
            <h2 className="font-semibold text-surface-800 mb-4">Upload Document</h2>
            <div className="flex flex-col md:flex-row gap-3">
              <select
                value={docType}
                onChange={e => setDocType(e.target.value)}
                className="input-field text-sm md:w-56 flex-shrink-0"
              >
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.docx" className="hidden" onChange={handleDocUpload} />
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-primary-300 text-primary-600 rounded-xl text-sm font-medium hover:bg-primary-50 transition-colors flex-1 justify-center"
              >
                <Upload size={16} /> Choose Files to Upload
              </button>
            </div>
            <p className="text-xs text-surface-400 mt-2">Supported: PDF, JPG, PNG, DOCX. Max 10 MB per file.</p>
          </div>

          {/* Documents list */}
          <div className="card overflow-hidden p-0">
            <div className="px-5 py-4 border-b border-surface-200">
              <h2 className="font-semibold text-surface-800">My Documents ({docs.length})</h2>
            </div>
            {docs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText size={40} className="text-surface-300 mb-3" />
                <p className="text-surface-500">No documents uploaded yet</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-100">
                {docs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-50 transition-colors group">
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText size={18} className="text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-surface-800 truncate">{doc.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-surface-500">{doc.type}</span>
                        <span className="text-xs text-surface-400">•</span>
                        <span className="text-xs text-surface-400">{doc.size}</span>
                        <span className="text-xs text-surface-400">•</span>
                        <span className="text-xs text-surface-400">Uploaded {doc.uploadedAt}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toast('Document preview coming soon')}
                        className="w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400 hover:text-primary-600 transition-colors"
                        title="View"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => toast('Download starting…')}
                        className="w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400 hover:text-primary-600 transition-colors"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => removeDoc(doc.id)}
                        className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-surface-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bank Details Tab */}
      {tab === 'bank' && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-surface-800">Bank Account Details</h2>
            {bankSaved && (
              <div className="flex items-center gap-1.5 text-green-600 text-sm">
                <CheckCircle size={15} /> Saved securely
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-start gap-2">
            <CreditCard size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">Your bank details are encrypted and used only for salary disbursement. Never share this information outside the platform.</p>
          </div>

          <form onSubmit={handleBankSave} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-surface-600 mb-1.5 block">Account Holder Name *</label>
                <input
                  required
                  className="input-field text-sm"
                  placeholder="As on bank records"
                  value={bankForm.accountHolder}
                  onChange={e => setBankForm(f => ({ ...f, accountHolder: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-surface-600 mb-1.5 block">Bank Name *</label>
                <input
                  required
                  className="input-field text-sm"
                  placeholder="e.g. HDFC Bank"
                  value={bankForm.bankName}
                  onChange={e => setBankForm(f => ({ ...f, bankName: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-surface-600 mb-1.5 block">Account Number *</label>
                <input
                  required
                  type="password"
                  className="input-field text-sm"
                  placeholder="Enter account number"
                  value={bankForm.accountNumber}
                  onChange={e => setBankForm(f => ({ ...f, accountNumber: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-surface-600 mb-1.5 block">IFSC / Routing Code *</label>
                <input
                  required
                  className="input-field text-sm"
                  placeholder="e.g. HDFC0001234"
                  value={bankForm.ifsc}
                  onChange={e => setBankForm(f => ({ ...f, ifsc: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-surface-600 mb-1.5 block">Account Type</label>
                <select
                  className="input-field text-sm"
                  value={bankForm.accountType}
                  onChange={e => setBankForm(f => ({ ...f, accountType: e.target.value }))}
                >
                  {['Savings', 'Current', 'Salary', 'Other'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-surface-600 mb-1.5 block">SWIFT / BIC Code <span className="text-surface-400 font-normal">(international)</span></label>
                <input
                  className="input-field text-sm"
                  placeholder="e.g. HDFCINBB"
                  value={bankForm.swiftCode}
                  onChange={e => setBankForm(f => ({ ...f, swiftCode: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBankForm({ accountHolder: user?.name || '', bankName: '', accountNumber: '', ifsc: '', accountType: 'Savings', swiftCode: '' })}
                className="btn-outline text-sm"
              >
                <X size={14} /> Clear
              </button>
              <button type="submit" className="btn-primary text-sm">
                <Plus size={14} /> Save Bank Details
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfilePage;
