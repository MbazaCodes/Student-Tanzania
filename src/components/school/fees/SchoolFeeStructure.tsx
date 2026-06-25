// src/components/school/fees/SchoolFeeStructure.tsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface FeeItem {
  id: string;
  name: string;
  amount: number;
  frequency: 'one-time' | 'monthly' | 'termly' | 'annual';
  category: 'tuition' | 'registration' | 'exam' | 'activity' | 'other';
  description?: string;
}

export interface FeeStructure {
  schoolType: 'government' | 'private';
  currency: string;
  items: FeeItem[];
}

interface SchoolFeeStructureProps {
  initialData?: FeeStructure;
  onSave?: (data: FeeStructure) => Promise<void>;
}

const defaultGovernmentFees: FeeStructure = {
  schoolType: 'government',
  currency: 'TZS',
  items: [
    { id: '1', name: 'Registration Fee', amount: 10000, frequency: 'one-time', category: 'registration' },
    { id: '2', name: 'Tuition Fee', amount: 0, frequency: 'termly', category: 'tuition' },
    { id: '3', name: 'Examination Fee', amount: 5000, frequency: 'termly', category: 'exam' },
  ],
};

const defaultPrivateFees: FeeStructure = {
  schoolType: 'private',
  currency: 'TZS',
  items: [
    { id: '1', name: 'Registration Fee', amount: 50000, frequency: 'one-time', category: 'registration' },
    { id: '2', name: 'Tuition Fee', amount: 250000, frequency: 'termly', category: 'tuition' },
    { id: '3', name: 'Examination Fee', amount: 15000, frequency: 'termly', category: 'exam' },
    { id: '4', name: 'Activity Fee', amount: 10000, frequency: 'termly', category: 'activity' },
    { id: '5', name: 'Development Fee', amount: 20000, frequency: 'termly', category: 'other' },
  ],
};

const FREQUENCY_LABELS = {
  'one-time': 'One Time',
  'monthly': 'Monthly',
  'termly': 'Termly',
  'annual': 'Annual',
};

const CATEGORY_LABELS = {
  tuition: 'Tuition',
  registration: 'Registration',
  exam: 'Examination',
  activity: 'Activity',
  other: 'Other',
};

export function SchoolFeeStructure({ initialData, onSave }: SchoolFeeStructureProps) {
  const [loading, setLoading] = useState(false);
  const [feeData, setFeeData] = useState<FeeStructure>(
    initialData || defaultGovernmentFees
  );
  const [editingItem, setEditingItem] = useState<FeeItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<Partial<FeeItem>>({
    name: '',
    amount: 0,
    frequency: 'termly',
    category: 'tuition',
  });

  const handleSchoolTypeChange = (type: 'government' | 'private') => {
    const defaultData = type === 'government' ? defaultGovernmentFees : defaultPrivateFees;
    setFeeData({
      ...defaultData,
      items: [...defaultData.items],
    });
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const item: FeeItem = {
      id: Date.now().toString(),
      name: newItem.name,
      amount: newItem.amount,
      frequency: newItem.frequency as FeeItem['frequency'],
      category: newItem.category as FeeItem['category'],
      description: newItem.description,
    };

    setFeeData(prev => ({
      ...prev,
      items: [...prev.items, item],
    }));
    setNewItem({ name: '', amount: 0, frequency: 'termly', category: 'tuition' });
    setShowAddForm(false);
    toast.success('Fee item added');
  };

  const handleEditItem = (item: FeeItem) => {
    setEditingItem(item);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    setFeeData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === editingItem.id ? editingItem : item
      ),
    }));
    setEditingItem(null);
    toast.success('Fee item updated');
  };

  const handleDeleteItem = (id: string) => {
    setFeeData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id),
    }));
    toast.success('Fee item deleted');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave?.(feeData);
      toast.success('Fee structure saved successfully!');
    } catch (error) {
      toast.error('Failed to save fee structure');
    } finally {
      setLoading(false);
    }
  };

  const totalFees = feeData.items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fee Structure</CardTitle>
              <CardDescription>
                Configure school fees based on school type
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label>School Type</Label>
                <Select
                  value={feeData.schoolType}
                  onValueChange={(value) => handleSchoolTypeChange(value as 'government' | 'private')}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="government">Government School</SelectItem>
                    <SelectItem value="private">Private School</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Total Fees</div>
                <div className="text-2xl font-bold">
                  {feeData.currency} {totalFees.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Fee Items</div>
                <div className="text-2xl font-bold">{feeData.items.length}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">School Type</div>
                <div className="text-lg font-semibold capitalize">
                  {feeData.schoolType}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Fee Items</h3>
              <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Fee Item
              </Button>
            </div>

            {showAddForm && (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Fee Name *</Label>
                    <Input
                      value={newItem.name}
                      onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Tuition Fee"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (TZS) *</Label>
                    <Input
                      type="number"
                      value={newItem.amount}
                      onChange={(e) => setNewItem(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      placeholder="250000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={newItem.frequency}
                      onValueChange={(value) => setNewItem(prev => ({ ...prev, frequency: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one-time">One Time</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="termly">Termly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tuition">Tuition</SelectItem>
                        <SelectItem value="registration">Registration</SelectItem>
                        <SelectItem value="exam">Examination</SelectItem>
                        <SelectItem value="activity">Activity</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddItem}>Add Item</Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Frequency</th>
                    <th className="px-4 py-3 text-right">Amount (TZS)</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feeData.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-3">
                        {editingItem?.id === item.id ? (
                          <Input
                            value={editingItem.name}
                            onChange={(e) => setEditingItem(prev => prev ? { ...prev, name: e.target.value } : null)}
                          />
                        ) : (
                          <div>
                            <div>{item.name}</div>
                            {item.description && (
                              <div className="text-xs text-muted-foreground">{item.description}</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </td>
                      <td className="px-4 py-3">
                        {FREQUENCY_LABELS[item.frequency] || item.frequency}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {editingItem?.id === item.id ? (
                          <Input
                            type="number"
                            value={editingItem.amount}
                            onChange={(e) => setEditingItem(prev => prev ? { ...prev, amount: Number(e.target.value) } : null)}
                            className="w-32 ml-auto"
                          />
                        ) : (
                          item.amount.toLocaleString()
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingItem?.id === item.id ? (
                          <Button size="sm" onClick={handleSaveEdit}>
                            Save
                          </Button>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleEditItem(item)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(item.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {feeData.items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No fee items configured. Add your first fee item above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
