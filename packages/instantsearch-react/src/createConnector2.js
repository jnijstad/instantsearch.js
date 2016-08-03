import React, {PropTypes, Component} from 'react';
import {connect} from 'react-algoliasearch-helper';
import has from 'lodash/object/has';
import omit from 'lodash/object/omit';

const ORIGINAL_PROPS_KEY = '__original';

export default function createConnector(connectorDesc) {
  if (!connectorDesc.displayName) {
    throw new Error(
      '`createConnector` requires you to provide a `displayName` property.'
    );
  }

  return (adapterDesc = {}) => {
    const hasInitialState = has(connectorDesc, 'getInitialState');
    const hasRefine = has(connectorDesc, 'refineSearchParameters');
    const hasMapState = has(connectorDesc, 'mapAlgoliaStateToProps');
    const hasGetProps = has(connectorDesc, 'getProps');
    const hasShouldRender = has(connectorDesc, 'shouldRender');

    const hasMapProps = has(adapterDesc, 'mapPropsToConfig');

    const connector = connect((algoliaState, props) => {
      const customProps = hasMapProps ?
        adapterDesc.mapPropsToConfig(props) :
        props;
      const connectProps = hasMapState ?
        connectorDesc.mapAlgoliaStateToProps(algoliaState, customProps) :
        null;
      return {
        // Keep track of the original props.
        // The HOC's props are more of a configuration/state store, which we
        // don't want to transfer to the composed component.
        [ORIGINAL_PROPS_KEY]: props,
        ...customProps,
        ...connectProps,
      };
    });

    return Composed => {
      class Connector extends Component {
        static displayName = connectorDesc.displayName;
        static propTypes = {
          ...connectorDesc.propTypes,
          id: PropTypes.string.isRequired,
        };

        static contextTypes = {
          // @TODO: more precise state manager propType
          algoliaStateManager: PropTypes.object.isRequired,
        };

        constructor(props, context) {
          super();

          const {algoliaStateManager: stateManager} = context;

          let initialState = null;
          if (stateManager.hasWidgetState(props.id)) {
            initialState = stateManager.getWidgetState(props.id);
          } else if (props.initialState) {
            initialState = props.initialState;
          } else if (hasInitialState) {
            initialState = connectorDesc.getInitialState(props);
          }

          this.state = {
            state: initialState,
          };

          this.unsubscribe = stateManager.subscribe(() => {
            this.setState({
              state: stateManager.hasWidgetState(this.props.id) ?
                stateManager.getWidgetState(this.props.id) :
                initialState,
            });
          });

          if (hasRefine) {
            const refiner = searchParameters =>
              connectorDesc.refineSearchParameters(
                searchParameters,
                this.props,
                this.state.state
              );
            this.unregisterWidget = stateManager.registerWidget(
              props.id,
              refiner
            );
          }
        }

        componentWillReceiveProps(nextProps) {
          if (nextProps.id !== this.props.id) {
            throw new Error('The `id` prop cannot be updated.');
          }
          if (hasRefine) {
            this.context.algoliaStateManager.markDirty();
          }
        }

        componentWillUnmount() {
          if (hasRefine) {
            this.unregisterWidget();
          }
        }

        refine = nextState => {
          this.context.algoliaStateManager.setWidgetState(
            this.props.id,
            nextState
          );
        };

        createURL = nextState => this.context.algoliaStateManager.createURL(
          this.props.id,
          nextState
        );

        render() {
          if (hasShouldRender && !connectorDesc.shouldRender(this.props)) {
            return null;
          }

          // The `getProps` methods allows for passing new props to the composed
          // component that are derived from the connector's own props and
          // state.
          const filteredProps = omit(this.props, [ORIGINAL_PROPS_KEY]);
          const props = hasGetProps ?
            connectorDesc.getProps(filteredProps, this.state.state) :
            filteredProps;
          const refineProps = hasRefine ?
            {refine: this.refine, createURL: this.createURL} :
            {};
          return (
            <Composed
              {...this.props[ORIGINAL_PROPS_KEY]}
              {...refineProps}
              {...props}
            />
          );
        }
      }

      const Connected = connector(Connector);

      Connected.defaultProps = {
        ...connectorDesc.defaultProps,
        ...adapterDesc.defaultProps,
      };

      return Connected;
    };
  };
}
