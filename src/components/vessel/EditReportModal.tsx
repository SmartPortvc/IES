import React, { useState, useEffect } from "react";
import Button from "../../components/ui/Button";
import FormField from "../../components/ui/FormField";
import { Calendar, Ship, Package } from "lucide-react";

interface EditReportModalProps {
  report: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedReport: any) => void;
}

const EditReportModal: React.FC<EditReportModalProps> = ({
  report,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (report) {
      setFormData({
        ...report,
        departureDate: report.departureDate || "",
        clearanceIssued: report.clearanceIssued || "",
        dailyData: [...(report.dailyData || [])],
        totalQuantity: report.totalQuantity || "",
        demurragesCollected: report.demurragesCollected || "",
      });
    }
  }, [report]);

  if (!isOpen || !formData) return null;

  const handleDailyDataChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const newDailyData = [...formData.dailyData];
    newDailyData[index] = {
      ...newDailyData[index],
      [field]: value,
    };
    setFormData({ ...formData, dailyData: newDailyData });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Edit Weekly Performance Report
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Update vessel performance information and daily cargo details
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span className="sr-only">Close</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              id="departureDate"
              label="Date of Departure"
              icon={<Calendar className="h-5 w-5 text-seagreen-500" />}
            >
              <input
                type="date"
                id="departureDate"
                value={formData.departureDate}
                onChange={(e) =>
                  setFormData({ ...formData, departureDate: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              />
            </FormField>
            <FormField
              id="clearanceIssued"
              label="Clearance Issued"
              icon={<Calendar className="h-5 w-5 text-seagreen-500" />}
            >
              <input
                type="date"
                id="clearanceIssued"
                value={formData.clearanceIssued}
                onChange={(e) =>
                  setFormData({ ...formData, clearanceIssued: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              />
            </FormField>
            <FormField
              id="totalQuantity"
              label="Total Quantity"
              icon={<Package className="h-5 w-5 text-seagreen-500" />}
            >
              <input
                type="number"
                id="totalQuantity"
                value={formData.totalQuantity}
                onChange={(e) =>
                  setFormData({ ...formData, totalQuantity: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              />
            </FormField>
          </div>

          <div className="col-span-2">
            <h3 className="text-lg font-medium mb-4">Daily Cargo Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4  py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 w-40 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type of Cargo in Detail
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type of Cargo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Demarage charges collected from the ship in Rs.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.dailyData?.map((day: any, index: number) => (
                    <tr key={index}>
                      <td className="px-4 py-2">
                        <input
                          type="date"
                          value={day.date}
                          onChange={(e) =>
                            handleDailyDataChange(index, "date", e.target.value)
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-seagreen-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={day.cargoType}
                          onChange={(e) =>
                            handleDailyDataChange(
                              index,
                              "cargoType",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-seagreen-500"
                        >
                          <option value="">Select Cargo Type</option>
                          <option value="Break Bulk">Break Bulk</option>
                          <option value="Project">Project</option>
                          <option value="Liquid Bulk">Liquid Bulk</option>
                          <option value="Container">Container</option>
                          <option value="Dry Bulk">Dry Bulk</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={day.typeOfCargo || ""}
                          onChange={(e) =>
                            handleDailyDataChange(
                              index,
                              "typeOfCargo",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-seagreen-500"
                          placeholder="Enter cargo type"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={day.totalQuantity || ""}
                          onChange={(e) =>
                            handleDailyDataChange(
                              index,
                              "totalQuantity",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-seagreen-500"
                          placeholder="Enter quantity"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={day.demurrages || ""}
                          onChange={(e) =>
                            handleDailyDataChange(
                              index,
                              "demurrages",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-seagreen-500"
                          placeholder="Enter demurrages"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={day.reason || ""}
                          onChange={(e) =>
                            handleDailyDataChange(
                              index,
                              "reason",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-seagreen-500"
                          placeholder="Enter Reason"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-seagreen-600 hover:bg-seagreen-700"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditReportModal;
