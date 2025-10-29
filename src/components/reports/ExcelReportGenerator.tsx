import React, { useState } from 'react';
import { Download, Calendar, FileSpreadsheet } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import DateRangePicker from '../ui/DateRangePicker';

interface ExcelReportGeneratorProps {
  onGenerateWeekly: (portId: string) => void;
  onGenerateCustom: (fromDate: string, toDate: string, portId: string) => void;
  ports: Array<{ id?: string; portName: string }>;
  selectedPortId?: string;
  onPortChange?: (portId: string) => void;
  isAdmin?: boolean;
  loading?: boolean;
}

const ExcelReportGenerator: React.FC<ExcelReportGeneratorProps> = ({
  onGenerateWeekly,
  onGenerateCustom,
  ports,
  selectedPortId = 'all',
  onPortChange,
  isAdmin = false,
  loading = false,
}) => {
  const [reportType, setReportType] = useState<'weekly' | 'custom'>('weekly');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [localPortId, setLocalPortId] = useState(selectedPortId);

  const handlePortChange = (portId: string) => {
    setLocalPortId(portId);
    if (onPortChange) {
      onPortChange(portId);
    }
  };

  const handleGenerateReport = () => {
    if (reportType === 'weekly') {
      onGenerateWeekly(localPortId);
    } else {
      if (fromDate && toDate) {
        onGenerateCustom(fromDate, toDate, localPortId);
      } else {
        alert('Please select both From Date and To Date for custom report');
      }
    }
  };

  const canGenerate = reportType === 'weekly' || (fromDate && toDate);

  return (
    <Card
      title="Generate Excel Reports"
      icon={<FileSpreadsheet className="h-6 w-6 text-seagreen-600" />}
      className="mb-6"
    >
      <div className="space-y-6">
        <div className="flex flex-col space-y-4">
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Port
              </label>
              <select
                value={localPortId}
                onChange={(e) => handlePortChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              >
                <option value="all">All Ports</option>
                {ports.map((port) => (
                  <option key={port.id} value={port.id}>
                    {port.portName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Report Type
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setReportType('weekly')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  reportType === 'weekly'
                    ? 'border-seagreen-500 bg-seagreen-50 text-seagreen-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span className="font-medium">Weekly Report</span>
                </div>
                <p className="text-xs mt-1 text-gray-600">
                  Last 7 days from today
                </p>
              </button>

              <button
                onClick={() => setReportType('custom')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  reportType === 'custom'
                    ? 'border-seagreen-500 bg-seagreen-50 text-seagreen-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span className="font-medium">Custom Report</span>
                </div>
                <p className="text-xs mt-1 text-gray-600">
                  Select date range
                </p>
              </button>
            </div>
          </div>

          {reportType === 'custom' && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <DateRangePicker
                fromDate={fromDate}
                toDate={toDate}
                onFromDateChange={setFromDate}
                onToDateChange={setToDate}
                fromLabel="From Arrival Date"
                toLabel="To Arrival Date"
              />
            </div>
          )}

          {reportType === 'weekly' && (
            <div className="p-4 bg-seagreen-50 rounded-lg">
              <div className="flex items-center space-x-2 text-seagreen-700">
                <Calendar className="h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Weekly Report Range</p>
                  <p className="text-xs">
                    {new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} - {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {localPortId === 'all' ? (
              <p className="text-seagreen-600 font-medium">
                Report will include all ports
              </p>
            ) : (
              <p>
                <span className="font-medium">Port:</span> {ports.find(p => p.id === localPortId)?.portName || 'Selected Port'}
              </p>
            )}
          </div>
          <Button
            onClick={handleGenerateReport}
            disabled={!canGenerate || loading}
            icon={<Download className="h-4 w-4" />}
          >
            {loading ? 'Generating...' : `Download ${reportType === 'weekly' ? 'Weekly' : 'Custom'} Report`}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ExcelReportGenerator;
