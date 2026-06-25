// src/components/school/settings/SchoolSettings.tsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SchoolSettingsData {
  schoolName: string;
  schoolCode: string;
  email: string;
  phone: string;
  address: string;
  principalName: string;
  academicYear: string;
  term: string;
  notificationsEnabled: boolean;
  autoBackup: boolean;
}

interface SchoolSettingsProps {
  initialSettings?: Partial<SchoolSettingsData>;
  onSave?: (settings: SchoolSettingsData) => Promise<void>;
}

const defaultSettings: SchoolSettingsData = {
  schoolName: '',
  schoolCode: '',
  email: '',
  phone: '',
  address: '',
  principalName: '',
  academicYear: '2024/2025',
  term: 'Term 1',
  notificationsEnabled: true,
  autoBackup: false,
};

const ACADEMIC_YEARS = ['2023/2024', '2024/2025', '2025/2026'];
const TERMS = ['Term 1', 'Term 2', 'Term 3'];

export function SchoolSettings({ initialSettings, onSave }: SchoolSettingsProps) {
  const [settings, setSettings] = useState<SchoolSettingsData>({
    ...defaultSettings,
    ...initialSettings,
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave?.(settings);
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>School Information</CardTitle>
          <CardDescription>Update your school's basic information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>School Name *</Label>
              <Input
                value={settings.schoolName}
                onChange={(e) => setSettings(prev => ({ ...prev, schoolName: e.target.value }))}
                placeholder="Your School Name"
              />
            </div>
            <div className="space-y-2">
              <Label>School Code</Label>
              <Input
                value={settings.schoolCode}
                onChange={(e) => setSettings(prev => ({ ...prev, schoolCode: e.target.value }))}
                placeholder="SC001"
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                placeholder="school@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={settings.phone}
                onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+255 7XX XXX XXX"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Address</Label>
              <Input
                value={settings.address}
                onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                placeholder="School Address"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Principal / Head of School</Label>
              <Input
                value={settings.principalName}
                onChange={(e) => setSettings(prev => ({ ...prev, principalName: e.target.value }))}
                placeholder="Principal's Name"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic Settings</CardTitle>
          <CardDescription>Configure academic year and term</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select
                value={settings.academicYear}
                onValueChange={(value) => setSettings(prev => ({ ...prev, academicYear: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_YEARS.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Current Term</Label>
              <Select
                value={settings.term}
                onValueChange={(value) => setSettings(prev => ({ ...prev, term: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map((term) => (
                    <SelectItem key={term} value={term}>{term}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Configure your notification and backup preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-xs text-muted-foreground">Receive email notifications for important events</p>
            </div>
            <Switch
              checked={settings.notificationsEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notificationsEnabled: checked }))}
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Auto Backup</Label>
              <p className="text-xs text-muted-foreground">Automatically backup school data</p>
            </div>
            <Switch
              checked={settings.autoBackup}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBackup: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <Button className="w-full" onClick={handleSave} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </>
        )}
      </Button>
    </div>
  );
}
