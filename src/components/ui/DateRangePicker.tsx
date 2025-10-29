import React from 'react';
import { Calendar } from 'lucide-react';
import FormField from './FormField';

interface DateRangePickerProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  fromLabel?: string;
  toLabel?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  fromLabel = 'From Date',
  toLabel = 'To Date'
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        id="fromDate"
        label={fromLabel}
        icon={<Calendar className="h-5 w-5 text-gray-400" />}
      >
        <input
          type="date"
          id="fromDate"
          value={fromDate}
          onChange={(e) => onFromDateChange(e.target.value)}
          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
        />
      </FormField>
      
      <FormField
        id="toDate"
        label={toLabel}
        icon={<Calendar className="h-5 w-5 text-gray-400" />}
      >
        <input
          type="date"
          id="toDate"
          value={toDate}
          onChange={(e) => onToDateChange(e.target.value)}
          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
        />
      </FormField>
    </div>
  );
};

export default DateRangePicker;