require('./style.css');

var instantsearch = require('../');

var search = new instantsearch.InstantSearch(
  'latency',
  '6be0576ff61c053d5f9a3225e2a90f76',
  'instant_search'
);

search.addWidget(
  instantsearch.widgets.searchBox({
    container: '#search-box',
    placeholder: 'Search for products',
    cssClass: 'form-control'
  })
);

search.addWidget(
  instantsearch.widgets.stats({
    container: '#stats'
  })
);

search.addWidget(
  instantsearch.widgets.hits({
    container: '#hits',
    templates: {
      empty: require('./templates/no-results.html'),
      hit: require('./templates/hit.html')
    },
    hitsPerPage: 6
  })
);

search.addWidget(
  instantsearch.widgets.pagination({
    container: '#pagination',
    cssClass: 'pagination',
    maxPages: 20
  })
);

search.addWidget(
  instantsearch.widgets.multipleChoiceList({
    container: '#brands',
    facetName: 'brand',
    operator: 'or',
    limit: 10,
    rootClass: 'nav nav-stacked',
    template: require('./templates/or.html')
  })
);

search.addWidget(
  instantsearch.widgets.menu({
    container: '#categories',
    facetName: 'categories',
    limit: 10,
    rootClass: 'list-unstyled',
    template: require('./templates/category.html')
  })
);

search.start();