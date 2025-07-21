import React from 'react';
import { Ship, Calendar, Package, Navigation, ExternalLink } from 'lucide-react';
import { Vessel } from '../../types';
import { formatDateTime, formatCurrency } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';

interface VesselRowProps {
  vessel: Vessel;
}

export const VesselRow: React.FC<VesselRowProps> = React.memo(({ vessel }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/vessel-details/${vessel.id}`);
  };

  return (
    <tr key={vessel.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <Ship className="h-5 w-5 text-seagreen-500 mr-2" />
          <div>
            <div className="text-sm font-medium text-gray-900">{vessel.vesselName}</div>
            {vessel.portName && (
              <div className="text-sm text-gray-500">{vessel.portName}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">IMO: {vessel.imo}</div>
        <div className="text-sm text-gray-500">GRT: {vessel.grt}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
          <div className="text-sm text-gray-900">
            {formatDateTime(vessel.arrivalDateTime)}
          </div>
        </div>
        <div className="flex items-center mt-1">
          <Navigation className="h-4 w-4 text-gray-400 mr-1" />
          <div className="text-sm text-gray-500">From: {vessel.arrivalFrom}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={vessel.operationType} label={vessel.operationType} />
        <div className="text-xs text-gray-500 mt-1">
          {vessel.operation}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <Package className="h-4 w-4 text-gray-400 mr-1" />
          <div>
            <div className="text-sm text-gray-900">{vessel.cargo.type}</div>
            <div className="text-xs text-gray-500">{vessel.cargo.name}</div>
          </div>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {vessel.cargoQuantity} • {vessel.cargo.volume} {vessel.cargo.units}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={vessel.voyageType} label={vessel.voyageType} />
        {vessel.totalRevenue && (
          <div className="text-xs text-gray-500 mt-1">
            Revenue: {formatCurrency(vessel.totalRevenue)}
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Button
          variant="outline"
          size="small"
          onClick={handleViewDetails}
          icon={<ExternalLink className="h-4 w-4" />}
        >
          View Details
        </Button>
      </td>
    </tr>
  );
});