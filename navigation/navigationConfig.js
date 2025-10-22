import Header from '../components/Header';
import { useSidebar } from '../context/SidebarContext';

export const getStackScreenOptions = ({ route, navigation }) => {
  // This is the header component for each screen in a stack.
  // The 'header' option allows us to render a completely custom component.
  return {
    header: (props) => {
      // We get the title from the screen's options, which we define in each Stack.Screen
      const title = props.options.title || props.route.name;
      // Get custom right actions if provided
      const rightActions = props.options.headerRight ? props.options.headerRight(props) : null;
      
      // Create a wrapper component to use the useSidebar hook
      const HeaderWithSidebar = () => {
        const { toggleSidebar } = useSidebar();
        return (
          <Header 
            title={title} 
            navigation={props.navigation} 
            rightActions={rightActions} 
            onToggleSidebar={toggleSidebar}
          />
        );
      };
      
      return <HeaderWithSidebar />;
    },
  };
};