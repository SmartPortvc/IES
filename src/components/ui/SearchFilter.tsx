import React from "react";
import { Search, Filter } from "lucide-react";
import Button from "./Button";

interface SearchFilterProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  searchPlaceholder?: string;
  filterOptions?: {
    value: string;
    label: string;
  }[];
  filterValue?: string;
  setFilterValue?: (value: string) => void;
  filterLabel?: string;
  onExport?: () => void;
  exportLabel?: string;
  showExport?: boolean;
  handleExportAllWeekly?: () => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  searchTerm,
  setSearchTerm,
  searchPlaceholder = "Search...",
  filterOptions,
  filterValue,
  setFilterValue,
  filterLabel = "Filter by",
  onExport,
  exportLabel = "Export CSV",
  showExport = false,
  handleExportAllWeekly,
}) => {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex-1 flex items-center relative">
        <Search className="absolute left-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
        />
      </div>

      <div className="flex items-center space-x-4">
        {filterOptions && filterValue !== undefined && setFilterValue && (
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-500 mr-2" />
            <select
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              aria-label={filterLabel}
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {showExport && onExport && (
          <Button
            variant="outline"
            onClick={onExport}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            }
          >
            {exportLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchFilter;
