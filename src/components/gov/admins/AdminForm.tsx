// src/components/gov/admins/AdminForm.tsx

import { useState } from 'react';
import { GovAdmin, AdminCreation } from '@/types/gov/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Copy, CheckCircle } from 'lucide-react';

interface AdminFormProps {
  regions: string[];
  districts: Record<string, string[]>;
  currentUserTier: number;
  currentUserRegion?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  editAdmin?: GovAdmin;
}

function generatePassword() {
  return 'ad' + Math.random().toString(36).slice(2, 8).toUpperCase() + '!';
}

export function AdminForm({ 
  regions,
  districts,
  currentUserTier,
  currentUserRegion,
  onSuccess,
  onCancel,
  editAdmin
}: AdminFormProps) {
  const isEditing = !!editAdmin;
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  
  const [formData, setFormData] = useState({
    name: editAdmin?.name || '',
    email: editAdmin?.email || '',
    role: (editAdmin?.role === 'gov' || editAdmin?.role === 'admin') 
      ? 'gov_region' 
      : (editAdmin?.role || (currentUserTier === 0 ? 'gov_region' : 'gov_district')),
    region: editAdmin?.region || currentUserRegion || '',
    district: editAdmin?.district || '',
    password: generatePassword(),
    status: editAdmin?.status || 'active',
    notes: editAdmin?.notes || '',
  });

  const canCreateRegional = currentUserTier === 0;
  const canCreateDistrict = currentUserTier === 0 || currentUserTier === 1;
  const regionLocked = currentUserTier === 1;
  const isDistrictRole = formData.role === 'gov_district';
  
  const availableDistricts = formData.region ? (districts[formData.region] || []) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.region) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (isDistrictRole && !formData.district) {
      toast.error('Please select a district');
      return;
    }

    setLoading(true);

    try {
      const payload: AdminCreation = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role as 'gov_region' | 'gov_district',
        region: formData.region,
        district: isDistrictRole ? formData.district : undefined,
      };

      const url = isEditing 
        ? /api/gov/admins/
        : '/api/gov/admins';

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save admin');
      }

      if (!isEditing) {
        setCredentials({
          email: formData.email,
          password: formData.password,
        });
        setSuccess(true);
      }
      
      toast.success(isEditing ? 'Admin updated successfully!' : 'Admin created successfully!');
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save admin');
    } finally {
      setLoading(false);
    }
  };

  if (success && credentials && !isEditing) {
    return (
      <div className="space-y-4 py-2">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5">
          <div className="font-bold text-emerald-800 text-sm mb-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Admin Created Successfully!
          </div>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <strong>{credentials.email}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Password</span>
              <strong>{credentials.password}</strong>
            </div>
          </div>
          <Button 
            className="mt-4 w-full" 
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(
                Email: \nPassword: 
              );
              toast.success('Credentials copied!');
            }}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Credentials
          </Button>
        </div>
        <Button variant="outline" className="w-full" onClick={onCancel}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      {/* Role Selection */}
      {!isEditing && canCreateRegional && (
        <div className="space-y-1.5">
          <Label>Admin Level *</Label>
          <Select 
            value={formData.role} 
            onValueChange={(v) => {
              setFormData(prev => ({ 
                ...prev, 
                role: v as 'gov_region' | 'gov_district',
                district: ''
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gov_region">Regional Admin  oversees 1 region</SelectItem>
              <SelectItem value="gov_district">District Admin  manages 1 district</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {!isEditing && !canCreateRegional && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-800">
          You're creating a <strong>District Admin</strong> in <strong>{currentUserRegion}</strong>.
        </div>
      )}

      {/* Name and Email */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label>Full Name *</Label>
          <Input 
            value={formData.name} 
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required 
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Email *</Label>
          <Input 
            type="email"
            value={formData.email} 
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="name@tsid.go.tz"
            required 
          />
        </div>
      </div>

      {/* Region and District */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Region *</Label>
          <Select 
            value={formData.region} 
            onValueChange={(v) => {
              setFormData(prev => ({ ...prev, region: v, district: '' }));
            }}
            disabled={regionLocked}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isDistrictRole && (
          <div className="space-y-1.5">
            <Label>District *</Label>
            <Select 
              value={formData.district} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, district: v }))}
              disabled={!formData.region}
            >
              <SelectTrigger>
                <SelectValue placeholder={formData.region ? "Select district" : "Region first"} />
              </SelectTrigger>
              <SelectContent>
                {availableDistricts.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Password (only for new admins) */}
      {!isEditing && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
          <Label>Temporary Password *</Label>
          <div className="flex gap-2">
            <Input 
              className="font-mono"
              value={formData.password} 
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required 
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => setFormData(prev => ({ ...prev, password: generatePassword() }))}
            >
              
            </Button>
          </div>
        </div>
      )}

      {/* Status (only for editing) */}
      {isEditing && (
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-1.5">
        <Label>Notes / Remarks</Label>
        <Input 
          value={formData.notes} 
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Internal note about this admin"
        />
      </div>

      <div className="flex gap-2">
        <Button 
          type="button" 
          variant="outline" 
          className="flex-1" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-1 bg-primary" 
          disabled={loading}
        >
          {loading ? 'Saving...' : isEditing ? 'Update Admin' : ' Create Admin'}
        </Button>
      </div>
    </form>
  );
}
