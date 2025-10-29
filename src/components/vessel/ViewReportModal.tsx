import React from "react";
import Button from "../../components/ui/Button";

interface ViewReportModalProps {
  report: any;
  isOpen: boolean;
  onClose: () => void;
}

const ViewReportModal: React.FC<ViewReportModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-6 max-w-5xl w-full  max-h-[800px] overflow-x-scroll mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Weekly Performance Report</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-4">Vessel Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-sm text-gray-500">Vessel Name</p>
                  <p className="font-medium">{report.vesselName || "N/A"}</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-sm text-gray-500">IMO Number</p>
                  <p className="font-medium">{report.imoNumber || "N/A"}</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-sm text-gray-500">Agent Name</p>
                  <p className="font-medium">{report.agentName || "N/A"}</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-sm text-gray-500">Owner Details</p>
                  <p className="font-medium">{report.ownerDetails || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-sm text-gray-500">DWT</p>
                  <p className="font-medium">{report.dwt || "N/A"}</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-sm text-gray-500">LOA</p>
                  <p className="font-medium">{report.loa || "N/A"}</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-sm text-gray-500">Purpose of Arrival</p>
                  <p className="font-medium">
                    {report.purposeOfArrival || "N/A"}
                  </p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">{report.status || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-sm text-gray-500">Date of Berthing</p>
                  <p className="font-medium">{report.berthedDate || "N/A"}</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-sm text-gray-500">Date of Departure</p>
                  <p className="font-medium">{report.departureDate || "N/A"}</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-sm text-gray-500">Clearance Issued</p>
                  <p className="font-medium">
                    {report.clearanceIssued || "N/A"}
                  </p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-sm text-gray-500">Total Quantity</p>
                  <p className="font-medium">{report.totalQuantity || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Daily Performance Data</h3>
            <div className="overflow-x-auto bg-gray-50 rounded-lg p-4">
              <table className="min-w-full">
                <thead className="bg-gray-100 rounded-t-lg">
                  <tr>
                    <th className="px-6 w-36 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider rounded-tl-lg">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Cargo Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type of Cargo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider rounded-tr-lg">
                      Demarage charges collected from the ship in Rs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider rounded-tr-lg">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.dailyData?.map((day: any, index: number) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {day.date || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {day.cargoType || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {day.typeOfCargo || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {day.totalQuantity || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {day.demurrages || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {day.reason || "-"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewReportModal;
