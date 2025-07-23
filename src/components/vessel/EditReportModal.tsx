import React, { useState, useEffect } from "react";
import Button from "../../components/ui/Button";
import FormField from "../../components/ui/FormField";

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
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Edit Weekly Performance Report
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Date of Departure"
              type="date"
              value={formData.departureDate}
              onChange={(e) =>
                setFormData({ ...formData, departureDate: e.target.value })
              }
            />
            <FormField
              label="Clearance Issued"
              type="date"
              value={formData.clearanceIssued}
              onChange={(e) =>
                setFormData({ ...formData, clearanceIssued: e.target.value })
              }
            />
            <FormField
              label="Total Quantity"
              type="number"
              value={formData.totalQuantity}
              onChange={(e) =>
                setFormData({ ...formData, totalQuantity: e.target.value })
              }
            />
            <FormField
              label="Demurrages Collected"
              type="number"
              value={formData.demurragesCollected}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  demurragesCollected: e.target.value,
                })
              }
            />
          </div>

          <div>
            <h3 className="font-semibold mb-4">Daily Performance Data</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cargo Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type of Cargo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Demurrages
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.dailyData?.map((day: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="date"
                          className="border rounded px-2 py-1 w-full"
                          value={day.date}
                          onChange={(e) =>
                            handleDailyDataChange(index, "date", e.target.value)
                          }
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          className="border rounded px-2 py-1 w-full"
                          value={day.cargoType}
                          onChange={(e) =>
                            handleDailyDataChange(
                              index,
                              "cargoType",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Select Cargo Type</option>
                          <option value="Break Bulk">Break Bulk</option>
                          <option value="Project">Project</option>
                          <option value="Liquid Bulk">Liquid Bulk</option>
                          <option value="Container">Container</option>
                          <option value="Dry Bulk">Dry Bulk</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-full"
                          value={day.typeOfCargo || ""}
                          onChange={(e) =>
                            handleDailyDataChange(
                              index,
                              "typeOfCargo",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-full"
                          value={day.totalQuantity || ""}
                          onChange={(e) =>
                            handleDailyDataChange(
                              index,
                              "totalQuantity",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-full"
                          value={day.demurrages || ""}
                          onChange={(e) =>
                            handleDailyDataChange(
                              index,
                              "demurrages",
                              e.target.value
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditReportModal;
