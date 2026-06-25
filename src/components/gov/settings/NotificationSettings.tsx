// src/components/gov/settings/NotificationSettings.tsx

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Mail, MessageSquare, Megaphone, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationSettingsProps {
  initialSettings?: NotificationPreferences;
  onSave?: (settings: NotificationPreferences) => Promise<void>;
  className?: string;
}

export interface NotificationPreferences {
  // In-app notifications
  inAppEnabled: boolean;
  inAppApprovals: boolean;
  inAppMessages: boolean;
  inAppAlerts: boolean;

  // Email notifications
  emailEnabled: boolean;
  emailApprovals: boolean;
  emailReports: boolean;
  emailDigest: boolean;
  emailDigestFrequency: 'daily' | 'weekly' | 'monthly';

  // SMS notifications
  smsEnabled: boolean;
  smsAlerts: boolean;
  smsApprovals: boolean;
  smsPhone: string;
}

const defaultPreferences: NotificationPreferences = {
  inAppEnabled: true,
  inAppApprovals: true,
  inAppMessages: true,
  inAppAlerts: true,
  emailEnabled: true,
  emailApprovals: true,
  emailReports: true,
  emailDigest: false,
  emailDigestFrequency: 'weekly',
  smsEnabled: false,
  smsAlerts: false,
  smsApprovals: false,
  smsPhone: '',
};

export function NotificationSettings({ 
  initialSettings = defaultPreferences,
  onSave,
  className 
}: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationPreferences>(initialSettings);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave?.(settings);
      toast.success('Notification settings saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </div>
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
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* In-App Notifications */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">In-App Notifications</h3>
            </div>
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable In-App Notifications</Label>
                  <p className="text-xs text-muted-foreground">Show notifications within the application</p>
                </div>
                <Switch 
                  checked={settings.inAppEnabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, inAppEnabled: checked }))}
                />
              </div>
              {settings.inAppEnabled && (
                <>
                  <div className="flex items-center justify-between">
                    <Label>Approval Notifications</Label>
                    <Switch 
                      checked={settings.inAppApprovals}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, inAppApprovals: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Message Notifications</Label>
                    <Switch 
                      checked={settings.inAppMessages}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, inAppMessages: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Alert Notifications</Label>
                    <Switch 
                      checked={settings.inAppAlerts}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, inAppAlerts: checked }))}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Email Notifications */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Email Notifications</h3>
            </div>
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch 
                  checked={settings.emailEnabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailEnabled: checked }))}
                />
              </div>
              {settings.emailEnabled && (
                <>
                  <div className="flex items-center justify-between">
                    <Label>Approval Emails</Label>
                    <Switch 
                      checked={settings.emailApprovals}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailApprovals: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Report Emails</Label>
                    <Switch 
                      checked={settings.emailReports}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailReports: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Daily/Weekly Digest</Label>
                      <p className="text-xs text-muted-foreground">Receive summary emails</p>
                    </div>
                    <Switch 
                      checked={settings.emailDigest}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailDigest: checked }))}
                    />
                  </div>
                  {settings.emailDigest && (
                    <div className="pl-4 space-y-1.5">
                      <Label>Digest Frequency</Label>
                      <select
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={settings.emailDigestFrequency}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          emailDigestFrequency: e.target.value as 'daily' | 'weekly' | 'monthly' 
                        }))}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* SMS Notifications */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">SMS Notifications</h3>
            </div>
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable SMS Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive notifications via SMS</p>
                </div>
                <Switch 
                  checked={settings.smsEnabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smsEnabled: checked }))}
                />
              </div>
              {settings.smsEnabled && (
                <>
                  <div className="flex items-center justify-between">
                    <Label>SMS Alerts</Label>
                    <Switch 
                      checked={settings.smsAlerts}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smsAlerts: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>SMS Approvals</Label>
                    <Switch 
                      checked={settings.smsApprovals}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smsApprovals: checked }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone Number</Label>
                    <Input 
                      type="tel"
                      value={settings.smsPhone}
                      onChange={(e) => setSettings(prev => ({ ...prev, smsPhone: e.target.value }))}
                      placeholder="+255 7XX XXX XXX"
                    />
                    <p className="text-xs text-muted-foreground">Phone number for SMS notifications</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
