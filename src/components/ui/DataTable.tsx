import React, { ReactNode } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';

interface DataTableProps {
  columns: {
    key: string;
    header: string;
    render?: (value: any, item: any) => ReactNode;
  }[];
  data: any[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  emptyIcon
}) => {
  if (loading) {
    return <LoadingSpinner message="Loading data..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  if (data.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-8 rounded text-center">
        {emptyIcon}
        <h3 className="text-lg font-medium">No data available</h3>
        <p className="mt-2 text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key} 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr key={item.id || index} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td key={`${item.id || index}-${column.key}`} className="px-6 py-4 whitespace-nowrap">
                  {column.render 
                    ? column.render(item[column.key], item) 
                    : item[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;