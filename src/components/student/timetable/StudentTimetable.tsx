// src/components/student/timetable/StudentTimetable.tsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  Download, 
  Printer,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimetableEntry {
  id: string;
  day: string;
  time: string;
  subject: string;
  teacher: string;
  room: string;
  type: 'theory' | 'practical' | 'lab' | 'sports';
}

interface StudentTimetableProps {
  timetable: TimetableEntry[];
  currentWeek?: string;
  onDownload?: () => void;
  onPrint?: () => void;
  onWeekChange?: (direction: 'prev' | 'next') => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = ['7:30 - 8:30', '8:30 - 9:30', '9:30 - 10:30', '10:30 - 11:30', '11:30 - 12:30', '12:30 - 13:30', '13:30 - 14:30', '14:30 - 15:30'];

const TYPE_COLORS = {
  theory: 'bg-blue-100 border-blue-200 text-blue-700',
  practical: 'bg-green-100 border-green-200 text-green-700',
  lab: 'bg-purple-100 border-purple-200 text-purple-700',
  sports: 'bg-amber-100 border-amber-200 text-amber-700',
};

const TYPE_LABELS = {
  theory: 'Theory',
  practical: 'Practical',
  lab: 'Lab',
  sports: 'Sports',
};

export function StudentTimetable({ 
  timetable, 
  currentWeek = 'Week 1',
  onDownload, 
  onPrint,
  onWeekChange 
}: StudentTimetableProps) {
  const [view, setView] = useState<'week' | 'day'>('week');
  const [selectedDay, setSelectedDay] = useState<string>('Monday');

  const getDayEntries = (day: string) => {
    return timetable.filter(entry => entry.day === day);
  };

  const getEntryForTime = (day: string, time: string) => {
    return timetable.find(entry => entry.day === day && entry.time === time);
  };

  const renderDayView = () => {
    const entries = getDayEntries(selectedDay);
    return (
      <div className="space-y-3">
        {TIME_SLOTS.map((time) => {
          const entry = entries.find(e => e.time === time);
          return (
            <div key={time} className={cn(
              "flex items-center p-3 border rounded-lg",
              entry ? "bg-card" : "bg-muted/20"
            )}>
              <div className="w-32 text-sm font-mono text-muted-foreground">{time}</div>
              {entry ? (
                <div className="flex-1 flex items-center gap-4">
                  <div className="font-medium">{entry.subject}</div>
                  <div className="text-sm text-muted-foreground">{entry.teacher}</div>
                  <Badge className={TYPE_COLORS[entry.type]}>
                    {TYPE_LABELS[entry.type]}
                  </Badge>
                  <div className="text-sm text-muted-foreground ml-auto">
                    Room: {entry.room}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Free</div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-sm font-medium text-muted-foreground border">Time</th>
              {DAYS.map((day) => (
                <th key={day} className="p-2 text-left text-sm font-medium text-muted-foreground border min-w-[120px]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((time) => (
              <tr key={time}>
                <td className="p-2 text-sm font-mono text-muted-foreground border">{time}</td>
                {DAYS.map((day) => {
                  const entry = getEntryForTime(day, time);
                  return (
                    <td key={`${day}-${time}`} className="p-2 border">
                      {entry ? (
                        <div className={cn(
                          "p-2 rounded-lg border",
                          TYPE_COLORS[entry.type]
                        )}>
                          <div className="font-medium text-sm">{entry.subject}</div>
                          <div className="text-xs">{entry.teacher}</div>
                          <div className="text-xs">Room: {entry.room}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground"></span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-semibold">{currentWeek}</div>
                <div className="text-sm text-muted-foreground">Academic Timetable</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onWeekChange && (
                <>
                  <Button size="sm" variant="outline" onClick={() => onWeekChange('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onWeekChange('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Select value={view} onValueChange={(v) => setView(v as 'week' | 'day')}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Week View</SelectItem>
                  <SelectItem value="day">Day View</SelectItem>
                </SelectContent>
              </Select>
              {view === 'day' && (
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day) => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button size="sm" variant="outline" onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button size="sm" variant="outline" onClick={onPrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(TYPE_COLORS).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded", value)} />
            <span className="text-sm capitalize">{key}</span>
          </div>
        ))}
      </div>

      {/* Timetable */}
      <Card>
        <CardContent className="p-4">
          {view === 'week' ? renderWeekView() : renderDayView()}
        </CardContent>
      </Card>
    </div>
  );
}
