import React, {PropTypes, Component} from 'react';
import algoliasearch from 'algoliasearch';
import algoliasearchHelper, {SearchParameters} from 'algoliasearch-helper';
import {Provider} from 'react-algoliasearch-helper';
import omit from 'lodash/object/omit';
import qs from 'qs';
import {createHistory, createMemoryHistory} from 'history';

import createStateManager from './createStateManager2';

class InstantSearch extends Component {
  static propTypes = {
    // @TODO: These props are currently constant.
    appId: PropTypes.string.isRequired,
    apiKey: PropTypes.string.isRequired,
    indexName: PropTypes.string.isRequired,

    history: PropTypes.object,
    urlSync: PropTypes.bool,
    treshold: PropTypes.number,
  };

  static defaultProps = {
    urlSync: true,
  };

  static childContextTypes = {
    // @TODO: more precise state manager propType
    algoliaStateManager: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    const client = algoliasearch(props.appId, props.apiKey);
    const helper = this.helper = algoliasearchHelper(client, props.indexName);

    const history =
      props.history ||
      (props.urlSync ? createHistory() : createMemoryHistory());

    let currentLocation;
    // In history V2, .listen is called with the initial location.
    // In V3, you need to use .getCurrentLocation()
    if (history.getCurrentLocation) {
      currentLocation = history.getCurrentLocation();
    }

    let ignoreThatOne = false;
    this.unlisten = history.listen(location => {
      if (!currentLocation && !history.getCurrentLocation) {
        // Initial location. Called synchronously by listen.
        currentLocation = location;
        return;
      }
      currentLocation = location;
      if (ignoreThatOne) {
        ignoreThatOne = false;
        return;
      }
      const state = qs.parse(currentLocation.search.slice(1));
      this.stateManager.setState(state);
    });

    // We could also use location.query with the useQueries enhancer, but that
    // would require a bit more configuration from the user.
    const initialState = qs.parse(currentLocation.search.slice(1));

    const createLocation = (location, state) => {
      const urlState = qs.parse(location.search.slice(1));
      const widgetsIds = this.stateManager.getWidgetsIds();
      const foreignParams = omit(urlState, widgetsIds);
      return {
        ...location,
        search: `?${qs.stringify({
          ...state,
          ...foreignParams,
        })}`,
      };
    };

    let lastPush = -1;
    this.stateManager = createStateManager(
      initialState,
      (state, refiners) => {
        ignoreThatOne = true;
        const href = history.createHref(createLocation(currentLocation, state));
        const newPush = Date.now();
        if (lastPush !== -1 && newPush - lastPush <= this.props.treshold) {
          history.replace(href);
        } else {
          history.push(href);
        }
        lastPush = newPush;
        const searchParameters = refiners.reduce(
          (res, refiner) => refiner(res),
          new SearchParameters({index: props.indexName})
        );
        helper.setState(searchParameters).search();
      },
      () => '#'
    );
  }

  componentWillUnmount() {
    this.unlisten();
  }

  getChildContext() {
    return {
      algoliaStateManager: this.stateManager,
    };
  }

  render() {
    return (
      <Provider
        {...omit(this.props, Object.keys(InstantSearch.propTypes))}
        helper={this.helper}
      />
    );
  }
}

export default InstantSearch;
