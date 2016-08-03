import React, {Component} from 'react';

import InstantSearch from '../src/InstantSearch2';
import connectHitsPerPage from '../src/connectors/connectHitsPerPage2';

const HitsPerPage = connectHitsPerPage({})(props =>
  <select value={props.value} onChange={e => props.refine(e.target.value)}>
    {props.values.map(value =>
      <option key={value} value={value}>{value}</option>
    )}
  </select>
);

class Search extends Component {
  render() {
    return (
      <InstantSearch
        appId="latency"
        apiKey="6be0576ff61c053d5f9a3225e2a90f76"
        indexName="instant_search"
      >
        <div>
          <HitsPerPage
            id="hPP"
            values={[10, 20, 30]}
            defaultValue={10}
          />
        </div>
      </InstantSearch>
    );
  }
}

export default Search;
