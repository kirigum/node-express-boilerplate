const PAGE = 1;
const LIMIT = 40;
const LISTED_SALE_STATE = 1;

const BASE_SALE_OPTION = {
  state: LISTED_SALE_STATE,
  order: 'asc',
  sort: 'price',
  symbol: 'WAX',
};

module.exports = {
	PAGE,
	LIMIT,
	BASE_SALE_OPTION
};