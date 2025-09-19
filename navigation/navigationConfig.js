import React from 'react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

export const getStackScreenOptions = ({ route, navigation }) => {
  // This is the header component for each screen in a stack.
  // The 'header' option allows us to render a completely custom component.
  return {
    header: (props) => {
      // We get the title from the screen's options, which we define in each Stack.Screen
      const title = props.options.title || props.route.name;
      // We pass the title and navigation props down to our custom Header component.
      return <Header title={title} navigation={props.navigation} />;
    },
  };
};