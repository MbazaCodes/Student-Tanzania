// src/components/gov/settings/GovSettings.tsx

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
  SelectValue 
} from '@/components/ui/select';
import { 
  Save, 
  Settings, 
  Globe, 
  Shield, 
  Bell, 
  Database,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface GovSettingsProps {
  initialSettings?: GovSettingsData;
  onSave?: (settings: GovSettingsData) => Promise<void>;
  className?: string;
}

export interface GovSettingsData {
  // General Settings
  siteName: string;
  defaultRegion?: string;
  defaultLanguage: 'en' | 'sw';
  timezone: string;

  // Security Settings
  requireMFA: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordExpiryDays: number;

  // Notification Settings
  emailNotifications: boolean;
  approvalNotifications: boolean;
  dailyDigest: boolean;
  digestTime: string;

  // Data Settings
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  dataRetentionDays: number;
}

const defaultSettings: GovSettingsData = {
  siteName: 'TSID Government Portal',
  defaultLanguage: 'en',
  timezone: 'Africa/Dar_es_Salaam',
  requireMFA: false,
  sessionTimeout: 60,
  maxLoginAttempts: 5,
  passwordExpiryDays: 90,
  emailNotifications: true,
  approvalNotifications: true,
  dailyDigest: false,
  digestTime: '08:00',
  autoBackup: true,
  backupFrequency: 'daily',
  dataRetentionDays: 365,
};

export function GovSettings({ 
  initialSettings = defaultSettings,
  onSave,
  className 
}: GovSettingsProps) {
  const [settings, setSettings] = useState<GovSettingsData>(initialSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'data'>('general');

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave?.(settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSettings(initialSettings);
    toast.info('Settings reset to default');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data', icon: Database },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Government Settings
            </CardTitle>
            <CardDescription>
              Configure government module settings and preferences
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} disabled={isLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button className="bg-primary" onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
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
        </div>
      </CardHeader>
      <CardContent>
        {/* Tabs */}
        <div className="flex gap-1 border-b mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Site Name</Label>
              <Input 
                value={settings.siteName}
                onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                placeholder="TSID Government Portal"
              />
              <p className="text-xs text-muted-foreground">Name displayed in the portal header</p>
            </div>

            <div className="space-y-1.5">
              <Label>Default Region</Label>
              <Select 
                value={settings.defaultRegion || ''} 
                onValueChange={(v) => setSettings(prev => ({ ...prev, defaultRegion: v || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select default region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="Dar es Salaam">Dar es Salaam</SelectItem>
                  <SelectItem value="Arusha">Arusha</SelectItem>
                  <SelectItem value="Mbeya">Mbeya</SelectItem>
                  <SelectItem value="Dodoma">Dodoma</SelectItem>
                  <SelectItem value="Mwanza">Mwanza</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Default region for new administrators</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Default Language</Label>
                <Select 
                  value={settings.defaultLanguage} 
                  onValueChange={(v) => setSettings(prev => ({ ...prev, defaultLanguage: v as 'en' | 'sw' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="sw">Swahili</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <Select 
                  value={settings.timezone} 
                  onValueChange={(v) => setSettings(prev => ({ ...prev, timezone: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Dar_es_Salaam">Africa/Dar es Salaam</SelectItem>
                    <SelectItem value="Africa/Nairobi">Africa/Nairobi</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <Label>Require Multi-Factor Authentication</Label>
                <p className="text-xs text-muted-foreground">Force MFA for all government users</p>
              </div>
              <Switch 
                checked={settings.requireMFA}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireMFA: checked }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Session Timeout (minutes)</Label>
                <Input 
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 60 }))}
                  min={5}
                  max={480}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Max Login Attempts</Label>
                <Input 
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) || 5 }))}
                  min={1}
                  max={20}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Password Expiry (days)</Label>
              <Input 
                type="number"
                value={settings.passwordExpiryDays}
                onChange={(e) => setSettings(prev => ({ ...prev, passwordExpiryDays: parseInt(e.target.value) || 90 }))}
                min={30}
                max={365}
              />
              <p className="text-xs text-muted-foreground">Number of days before password must be changed</p>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Send email notifications for important events</p>
              </div>
              <Switch 
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <Label>Approval Notifications</Label>
                <p className="text-xs text-muted-foreground">Notify about pending and completed approvals</p>
              </div>
              <Switch 
                checked={settings.approvalNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, approvalNotifications: checked }))}
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <Label>Daily Digest</Label>
                <p className="text-xs text-muted-foreground">Receive a daily summary of activities</p>
              </div>
              <Switch 
                checked={settings.dailyDigest}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, dailyDigest: checked }))}
              />
            </div>

            {settings.dailyDigest && (
              <div className="space-y-1.5">
                <Label>Digest Time</Label>
                <Input 
                  type="time"
                  value={settings.digestTime}
                  onChange={(e) => setSettings(prev => ({ ...prev, digestTime: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Time when daily digest is sent</p>
              </div>
            )}
          </div>
        )}

        {/* Data Settings */}
        {activeTab === 'data' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <Label>Auto Backup</Label>
                <p className="text-xs text-muted-foreground">Automatically backup system data</p>
              </div>
              <Switch 
                checked={settings.autoBackup}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBackup: checked }))}
              />
            </div>

            {settings.autoBackup && (
              <div className="space-y-1.5">
                <Label>Backup Frequency</Label>
                <Select 
                  value={settings.backupFrequency} 
                  onValueChange={(v) => setSettings(prev => ({ ...prev, backupFrequency: v as 'daily' | 'weekly' | 'monthly' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Data Retention (days)</Label>
              <Input 
                type="number"
                value={settings.dataRetentionDays}
                onChange={(e) => setSettings(prev => ({ ...prev, dataRetentionDays: parseInt(e.target.value) || 365 }))}
                min={30}
                max={730}
              />
              <p className="text-xs text-muted-foreground">Number of days to keep historical data</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
