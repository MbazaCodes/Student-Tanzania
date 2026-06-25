// src/components/gov/schools/SchoolRegistration.tsx

import { useState } from 'react';
import { SchoolRegistration as SchoolRegistrationType } from '@/types/gov/school';
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

interface SchoolRegistrationProps {
  regions: Record<string, Record<string, string[]>>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const SCHOOL_TYPES = [
  'Pre-School / Nursery',
  'Primary School',
  'Secondary School',
  'University / College',
  'Vocational Training',
  'Special Needs School',
];

function generatePassword() {
  return 'sc' + Math.random().toString(36).slice(2, 8).toUpperCase() + '!';
}

function generateSchoolCode(region: string) {
  const prefix = region.slice(0, 2).toUpperCase();
  return ${prefix};
}

export function SchoolRegistration({ 
  regions, 
  onSuccess, 
  onCancel 
}: SchoolRegistrationProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [credentials, setCredentials] = useState<{ code: string; email: string; password: string } | null>(null);
  
  const [formData, setFormData] = useState({
    school_name: '',
    type: 'Primary School',
    region: '',
    district: '',
    ward: '',
    address: '',
    phone: '',
    email: '',
    password: generatePassword(),
    school_code: '',
  });

  const districts = formData.region ? Object.keys(regions[formData.region] || {}) : [];
  const wards = (formData.region && formData.district) 
    ? (regions[formData.region]?.[formData.district] || []) 
    : [];

  const handleRegionChange = (region: string) => {
    setFormData(prev => ({
      ...prev,
      region,
      district: '',
      ward: '',
      school_code: generateSchoolCode(region),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.school_name || !formData.region || !formData.district || !formData.ward) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.email || !formData.password) {
      toast.error('Please provide login credentials');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/gov/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_name: formData.school_name,
          type: formData.type,
          region: formData.region,
          district: formData.district,
          ward: formData.ward,
          address: formData.address || undefined,
          phone: formData.phone || undefined,
          email: formData.email,
          password: formData.password,
          school_code: formData.school_code || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register school');
      }

      setCredentials({
        code: data.school_code || formData.school_code,
        email: formData.email,
        password: formData.password,
      });
      setSuccess(true);
      toast.success('School registered successfully!');
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to register school');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (formData.region) {
      setFormData(prev => ({
        ...prev,
        school_code: generateSchoolCode(prev.region),
        password: generatePassword(),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        password: generatePassword(),
      }));
    }
  };

  if (success && credentials) {
    return (
      <div className="space-y-4 py-2">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5">
          <div className="font-bold text-emerald-800 text-sm mb-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            School Registered Successfully!
          </div>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">School Code</span>
              <strong className="text-primary">{credentials.code}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Login Email</span>
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
                School Code: \nLogin Email: \nPassword: 
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
      <div className="grid grid-cols-2 gap-3">
        {/* Institution Type */}
        <div className="col-span-2 space-y-1.5">
          <Label>Institution Type *</Label>
          <Select 
            value={formData.type} 
            onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCHOOL_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* School Name */}
        <div className="col-span-2 space-y-1.5">
          <Label>School Name *</Label>
          <Input 
            value={formData.school_name} 
            onChange={(e) => setFormData(prev => ({ ...prev, school_name: e.target.value }))}
            required 
          />
        </div>

        {/* Region */}
        <div className="col-span-2 space-y-1.5">
          <Label>Region *</Label>
          <Select value={formData.region} onValueChange={handleRegionChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(regions).sort().map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* District */}
        <div className="space-y-1.5">
          <Label>District *</Label>
          <Select 
            value={formData.district} 
            onValueChange={(v) => setFormData(prev => ({ ...prev, district: v, ward: '' }))}
            disabled={!formData.region}
          >
            <SelectTrigger>
              <SelectValue placeholder={formData.region ? "Select district" : "Select region first"} />
            </SelectTrigger>
            <SelectContent>
              {districts.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ward */}
        <div className="space-y-1.5">
          <Label>Ward *</Label>
          <Select 
            value={formData.ward} 
            onValueChange={(v) => setFormData(prev => ({ ...prev, ward: v }))}
            disabled={!formData.district}
          >
            <SelectTrigger>
              <SelectValue placeholder={formData.district ? "Select ward" : "Select district first"} />
            </SelectTrigger>
            <SelectContent>
              {wards.map((w) => (
                <SelectItem key={w} value={w}>{w}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Address & Contact */}
        <div className="space-y-1.5">
          <Label>Address</Label>
          <Input 
            value={formData.address} 
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Contact Phone</Label>
          <Input 
            value={formData.phone} 
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+255 7XX XXX XXX"
          />
        </div>

        {/* Credentials Section */}
        <div className="col-span-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
          <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
             Admin Credentials
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>School Code *</Label>
              <Input 
                className="font-mono font-bold"
                value={formData.school_code} 
                onChange={(e) => setFormData(prev => ({ ...prev, school_code: e.target.value.toUpperCase() }))}
                placeholder="MW1234"
                required 
              />
            </div>
            <div className="space-y-1.5">
              <Label>Login Email *</Label>
              <Input 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="school@tsid.go.tz"
                required 
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <Input 
                className="font-mono"
                value={formData.password} 
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required 
              />
            </div>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleRegenerate}
          >
             Regenerate
          </Button>
        </div>
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
          {loading ? 'Registering...' : ' Register School'}
        </Button>
      </div>
    </form>
  );
}
