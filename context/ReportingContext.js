import { createContext, useCallback, useContext, useState } from 'react';

const ReportingContext = createContext();

export const ReportingProvider = ({ children }) => {
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [reportType, setReportType] = useState('client'); // 'client' ou 'supplier'

    const selectClient = useCallback((client) => {
        setSelectedClient(client);
        setSelectedSupplier(null);
        setReportType('client');
    }, []);

    const selectSupplier = useCallback((supplier) => {
        setSelectedSupplier(supplier);
        setSelectedClient(null);
        setReportType('supplier');
    }, []);

    const resetSelection = useCallback(() => {
        setSelectedClient(null);
        setSelectedSupplier(null);
    }, []);

    return (
        <ReportingContext.Provider
            value={{
                selectedClient,
                selectedSupplier,
                reportType,
                selectClient,
                selectSupplier,
                resetSelection,
                setReportType
            }}
        >
            {children}
        </ReportingContext.Provider>
    );
};

export const useReporting = () => {
    const context = useContext(ReportingContext);
    if (!context) {
        throw new Error('useReporting must be used within a ReportingProvider');
    }
    return context;
};
