import {PropTypes} from 'react';

import createConnector from '../createConnector2';

export default createConnector({
  displayName: 'AlgoliaHitsPerPage',

  propTypes: {
    defaultValue: PropTypes.number,
  },

  getInitialState(props) {
    return props.defaultValue;
  },

  getProps(props, state) {
    return {
      value: state,
    };
  },

  refineSearchParameters(searchParameters, props, state) {
    return searchParameters.setHitsPerPage(state);
  },
});
