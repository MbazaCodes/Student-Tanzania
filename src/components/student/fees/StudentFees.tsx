// src/components/student/fees/StudentFees.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Download,
  CreditCard,
  Calendar
} from 'lucide-react';

interface FeeItem {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paidDate?: string;
  category: string;
}

interface StudentFeesProps {
  fees: FeeItem[];
  totalFees: number;
  paidFees: number;
  onPay?: (feeId: string) => void;
  onDownload?: () => void;
}

export function StudentFees({ fees, totalFees, paidFees, onPay, onDownload }: StudentFeesProps) {
  const pendingFees = fees.filter(f => f.status === 'pending' || f.status === 'overdue');
  const overdueFees = fees.filter(f => f.status === 'overdue');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-600';
      case 'pending': return 'bg-amber-100 text-amber-600';
      case 'overdue': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const percentagePaid = totalFees > 0 ? (paidFees / totalFees) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Fees</div>
            <div className="text-2xl font-bold">TZS {totalFees.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Paid Fees</div>
            <div className="text-2xl font-bold text-green-600">TZS {paidFees.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Balance</div>
            <div className="text-2xl font-bold text-amber-600">TZS {(totalFees - paidFees).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Overdue</div>
            <div className="text-2xl font-bold text-red-600">{overdueFees.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Payment Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(percentagePaid)}%</span>
          </div>
          <Progress value={percentagePaid} className="h-2" />
        </CardContent>
      </Card>

      {/* Fee Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Fee Breakdown
              </CardTitle>
              <CardDescription>
                {fees.length} fee items  {pendingFees.length} pending
              </CardDescription>
            </div>
            {onDownload && (
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download Statement
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fees.map((fee) => (
              <div key={fee.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getStatusIcon(fee.status)}</div>
                  <div>
                    <div className="font-medium">{fee.name}</div>
                    <div className="text-sm text-muted-foreground">
                      <span className="capitalize">{fee.category}</span>
                      <span className="mx-2"></span>
                      <Calendar className="inline h-3 w-3 mr-1" />
                      Due: {new Date(fee.dueDate).toLocaleDateString()}
                    </div>
                    {fee.paidDate && (
                      <div className="text-xs text-green-600">
                        Paid on {new Date(fee.paidDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 md:mt-0">
                  <div className="text-right">
                    <div className="font-bold">TZS {fee.amount.toLocaleString()}</div>
                    <Badge className={getStatusColor(fee.status)}>
                      {getStatusLabel(fee.status)}
                    </Badge>
                  </div>
                  {fee.status !== 'paid' && onPay && (
                    <Button size="sm" onClick={() => onPay(fee.id)}>
                      <CreditCard className="h-3 w-3 mr-2" />
                      Pay Now
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {fees.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No fee items found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
