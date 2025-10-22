import { createContext, useCallback, useContext, useState } from 'react';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
    const [isSidebarVisible, setSidebarVisible] = useState(false);

    const toggleSidebar = useCallback(() => {
        setSidebarVisible(prev => !prev);
    }, []);

    const closeSidebar = useCallback(() => {
        setSidebarVisible(false);
    }, []);

    const openSidebar = useCallback(() => {
        setSidebarVisible(true);
    }, []);

    return (
        <SidebarContext.Provider 
            value={{ 
                isSidebarVisible, 
                toggleSidebar, 
                closeSidebar, 
                openSidebar,
                setSidebarVisible 
            }}
        >
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
};
