// src/gridie/index.ts
// Entry point for Gridie v1.0

// Main component
export { Gridie } from './gridie';

// Configuration types
export type {
  GridieConfig,
  GridieHeaderConfig,
  GridieCellAction,
  GridieFilterRowConfig,
  GridieFiltersConfig,
  GridieHeaderFilterConfig,
  HeaderFilterParameter,
  GridiePageSizeConfig,
  GridieJumpToConfig,
  GridieNavigationConfig,
  GridiePagingConfig,
  GridieMode
} from './gridie';

// Language types
export type { Language, LanguageStrings } from './lang';

// Sorting types
export type { SortDirection } from './sortingFunctions';

// Filtering types
export type { FilterOperator, FilterState } from './filteringFunctions';