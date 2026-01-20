/**
 * Worksheet-specific type definitions
 */

import { IHeaderCell, IDataCell, IFooterCell, ICellPosition, ICellRange } from './cell.types';
import { Color, Result } from './core.types';

/**
 * Worksheet configuration interface
 */
export interface IWorksheetConfig {
  /** Worksheet name */
  name: string;
  /** Tab color */
  tabColor?: Color;
  /** Default row height */
  defaultRowHeight?: number;
  /** Default column width */
  defaultColWidth?: number;
  /** Whether the worksheet is hidden */
  hidden?: boolean;
  /** Whether the worksheet is protected */
  protected?: boolean;
  /** Protection password */
  protectionPassword?: string;
  /** Whether to show grid lines */
  showGridLines?: boolean;
  /** Whether to show row and column headers */
  showRowColHeaders?: boolean;
  /** Zoom level (1-400) */
  zoom?: number;
  /** Freeze panes position */
  freezePanes?: ICellPosition;
  /** Print area */
  printArea?: ICellRange;
  /** Fit to page settings */
  fitToPage?: {
    fitToWidth?: number;
    fitToHeight?: number;
  };
  /** Page setup */
  pageSetup?: {
    orientation?: 'portrait' | 'landscape';
    paperSize?: number;
    fitToPage?: boolean;
    fitToWidth?: number;
    fitToHeight?: number;
    scale?: number;
    horizontalCentered?: boolean;
    verticalCentered?: boolean;
    margins?: {
      top?: number;
      left?: number;
      bottom?: number;
      right?: number;
      header?: number;
      footer?: number;
    };
  };
  /** Auto filter configuration */
  autoFilter?: {
    /** Enable auto filter for the worksheet */
    enabled?: boolean;
    /** Auto filter range (if not specified, applies to all data) */
    range?: ICellRange;
    /** Start row for auto filter (1-based, default: first data row) */
    startRow?: number;
    /** End row for auto filter (1-based, default: last data row) */
    endRow?: number;
    /** Start column for auto filter (1-based, default: 1) */
    startColumn?: number;
    /** End column for auto filter (1-based, default: last column) */
    endColumn?: number;
  };
  /** Print headers/footers configuration */
  printHeadersFooters?: {
    /** Header text (left, center, right) */
    header?: {
      left?: string;
      center?: string;
      right?: string;
    };
    /** Footer text (left, center, right) */
    footer?: {
      left?: string;
      center?: string;
      right?: string;
    };
  };
  /** Repeat rows/columns on each printed page */
  printRepeat?: {
    /** Rows to repeat (e.g., "1:2" or [1, 2]) */
    rows?: string | number[];
    /** Columns to repeat (e.g., "A:B" or [1, 2]) */
    columns?: string | number[];
  };
  /** Split panes configuration (divides window into panes) */
  splitPanes?: {
    /** Horizontal split position (column number, 0 = no split) */
    xSplit?: number;
    /** Vertical split position (row number, 0 = no split) */
    ySplit?: number;
    /** Top-left cell in bottom-right pane */
    topLeftCell?: string;
    /** Active pane (topLeft, topRight, bottomLeft, bottomRight) */
    activePane?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  };
  /** Sheet views configuration */
  views?: {
    /** View state (normal, pageBreakPreview, pageLayout) */
    state?: 'normal' | 'pageBreakPreview' | 'pageLayout';
    /** Zoom level (10-400) */
    zoomScale?: number;
    /** Normal zoom level */
    zoomScaleNormal?: number;
    /** Show grid lines */
    showGridLines?: boolean;
    /** Show row and column headers */
    showRowColHeaders?: boolean;
    /** Show ruler (page layout view) */
    showRuler?: boolean;
    /** Right-to-left */
    rightToLeft?: boolean;
  };
}

/**
 * Table structure interface
 */
export interface ITable {
  /** Table name */
  name?: string;
  /** Table headers */
  headers?: IHeaderCell[];
  /** Table sub-headers */
  subHeaders?: IHeaderCell[];
  /** Table data rows */
  body?: IDataCell[];
  /** Table footers */
  footers?: IFooterCell[];
  /** Table range */
  range?: ICellRange;
  /** Whether to show table borders */
  showBorders?: boolean;
  /** Whether to show alternating row colors */
  showStripes?: boolean;
  /** Table style */
  style?: 'TableStyleLight1' | 'TableStyleLight2' | 'TableStyleMedium1' | 'TableStyleMedium2' | 'TableStyleDark1' | 'TableStyleDark2';
  /** Auto filter for this table */
  autoFilter?: boolean;
}

/**
 * Worksheet interface
 */
export interface IWorksheet {
  /** Worksheet configuration */
  config: IWorksheetConfig;
  /** Tables in the worksheet */
  tables: ITable[];
  /** Current row pointer */
  currentRow: number;
  /** Current column pointer */
  currentCol: number;
  /** Header pointers for navigation */
  headerPointers: Map<string, ICellPosition>;
  /** Whether the worksheet has been built */
  isBuilt: boolean;

  /** Add a header */
  addHeader(header: IHeaderCell): this;
  /** Add subheaders */
  addSubHeaders(subHeaders: IHeaderCell[]): this;
  /** Add a row or rows */
  addRow(row: IDataCell[] | IDataCell): this;
  /** Add a footer or footers */
  addFooter(footer: IFooterCell[] | IFooterCell): this;
  /** Add a new table to the worksheet */
  addTable(tableConfig?: Partial<ITable>): this;
  /** Finalize the current table with temporary data */
  finalizeTable(): this;
  /** Get a table by name */
  getTable(name: string): ITable | undefined;
  /** Add an image to the worksheet */
  addImage(image: IWorksheetImage): this;
  /** Group rows (create collapsible outline) */
  groupRows(startRow: number, endRow: number, collapsed?: boolean): this;
  /** Group columns (create collapsible outline) */
  groupColumns(startCol: number, endCol: number, collapsed?: boolean): this;
  /** Add a named range */
  addNamedRange(name: string, range: string | ICellRange, scope?: string): this;
  /** Add an Excel structured table */
  addExcelTable(table: IExcelTable): this;
  /** Hide rows */
  hideRows(rows: number | number[]): this;
  /** Show rows */
  showRows(rows: number | number[]): this;
  /** Hide columns */
  hideColumns(columns: number | string | (number | string)[]): this;
  /** Show columns */
  showColumns(columns: number | string | (number | string)[]): this;
  /** Add a pivot table */
  addPivotTable(pivotTable: IPivotTable): this;
  /** Add a slicer to a table or pivot table */
  addSlicer(slicer: ISlicer): this;
  /** Add a watermark to the worksheet */
  addWatermark(watermark: IWatermark): this;
  /** Add a data connection */
  addDataConnection(connection: IDataConnection): this;
  /** Build the worksheet */
  build(workbook: any, options?: any): Promise<void>;
  /** Validate the worksheet */
  validate(): Result<boolean>;
}

/**
 * Worksheet event types
 */
export enum WorksheetEventType {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  TABLE_ADDED = 'tableAdded',
  TABLE_REMOVED = 'tableRemoved',
  CELL_ADDED = 'cellAdded',
  CELL_UPDATED = 'cellUpdated',
  CELL_DELETED = 'cellDeleted'
}

/**
 * Worksheet event interface
 */
export interface IWorksheetEvent {
  type: WorksheetEventType;
  worksheet: IWorksheet;
  data?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Worksheet validation result
 */
export interface IWorksheetValidationResult {
  /** Whether the worksheet is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** Cell validation results */
  cellResults: Map<string, boolean>;
}

/**
 * Worksheet statistics
 */
export interface IWorksheetStats {
  /** Total number of cells */
  totalCells: number;
  /** Number of header cells */
  headerCells: number;
  /** Number of data cells */
  dataCells: number;
  /** Number of footer cells */
  footerCells: number;
  /** Number of tables */
  tables: number;
  /** Used range */
  usedRange: ICellRange;
  /** Memory usage in bytes */
  memoryUsage: number;
}

/**
 * Image configuration for worksheet
 */
export interface IWorksheetImage {
  /** Image buffer (ArrayBuffer, Uint8Array, or base64 string) */
  buffer: ArrayBuffer | Uint8Array | string;
  /** Image name/ID */
  name?: string;
  /** Image extension (png, jpeg, gif, etc.) */
  extension: 'png' | 'jpeg' | 'jpg' | 'gif' | 'bmp' | 'webp';
  /** Position - can be cell reference or absolute position */
  position: {
    /** Cell reference (e.g., 'A1') or row number (1-based) */
    row: string | number;
    /** Column letter (e.g., 'A') or column number (1-based) */
    col: string | number;
  };
  /** Image size */
  size?: {
    /** Width in pixels or Excel units */
    width?: number;
    /** Height in pixels or Excel units */
    height?: number;
    /** Scale factor (0-1) */
    scaleX?: number;
    /** Scale factor (0-1) */
    scaleY?: number;
  };
  /** Hyperlink for image (optional) */
  hyperlink?: string;
  /** Image description/alt text */
  description?: string;
}

/**
 * Pivot table configuration
 */
export interface IPivotTable {
  /** Pivot table name */
  name: string;
  /** Reference cell where pivot table starts (e.g., 'A1') */
  ref: string;
  /** Source data range (e.g., 'A1:D100') */
  sourceRange: string;
  /** Source worksheet name (if different from current) */
  sourceSheet?: string;
  /** Pivot table fields configuration */
  fields: {
    /** Rows fields */
    rows?: string[];
    /** Columns fields */
    columns?: string[];
    /** Values fields with aggregation function */
    values?: Array<{
      name: string;
      stat: 'sum' | 'count' | 'average' | 'min' | 'max' | 'stdDev' | 'var';
    }>;
    /** Filters fields */
    filters?: string[];
  };
  /** Pivot table options */
  options?: {
    /** Show grand totals for rows */
    showRowGrandTotals?: boolean;
    /** Show grand totals for columns */
    showColGrandTotals?: boolean;
    /** Show headers */
    showHeaders?: boolean;
  };
}

/**
 * Slicer configuration for tables and pivot tables
 */
export interface ISlicer {
  /** Slicer name */
  name: string;
  /** Target table or pivot table name */
  targetTable: string;
  /** Column/field to create slicer for */
  column: string;
  /** Position where slicer should be placed */
  position: {
    /** Row number (1-based) */
    row: number;
    /** Column number or letter (1-based or 'A', 'B', etc.) */
    col: number | string;
  };
  /** Slicer size */
  size?: {
    /** Width in pixels */
    width?: number;
    /** Height in pixels */
    height?: number;
  };
  /** Slicer style */
  style?: {
    /** Caption style */
    caption?: string;
    /** Item style */
    itemStyle?: string;
  };
}

/**
 * Watermark configuration
 */
export interface IWatermark {
  /** Watermark text */
  text?: string;
  /** Watermark image (alternative to text) */
  image?: IWorksheetImage;
  /** Position */
  position?: {
    /** Horizontal position: 'left' | 'center' | 'right' */
    horizontal?: 'left' | 'center' | 'right';
    /** Vertical position: 'top' | 'middle' | 'bottom' */
    vertical?: 'top' | 'middle' | 'bottom';
  };
  /** Opacity (0-1) */
  opacity?: number;
  /** Rotation in degrees */
  rotation?: number;
  /** Font size (if using text) */
  fontSize?: number;
  /** Font color (if using text) */
  fontColor?: string;
}

/**
 * Data connection configuration
 */
export interface IDataConnection {
  /** Connection name */
  name: string;
  /** Connection type */
  type: 'odbc' | 'oledb' | 'web' | 'text' | 'xml';
  /** Connection string or URL */
  connectionString: string;
  /** Command text (SQL query, etc.) */
  commandText?: string;
  /** Refresh settings */
  refresh?: {
    /** Auto refresh on open */
    refreshOnOpen?: boolean;
    /** Refresh interval in minutes */
    refreshInterval?: number;
  };
  /** Credentials */
  credentials?: {
    /** Username */
    username?: string;
    /** Password */
    password?: string;
    /** Integrated security */
    integratedSecurity?: boolean;
  };
}

/**
 * Excel structured table configuration
 */
export interface IExcelTable {
  /** Table name */
  name: string;
  /** Table range (start and end cells) */
  range: {
    /** Start cell reference (e.g., 'A1') */
    start: string;
    /** End cell reference (e.g., 'D10') */
    end: string;
  };
  /** Table style */
  style?: 'TableStyleLight1' | 'TableStyleLight2' | 'TableStyleLight3' | 'TableStyleLight4' | 'TableStyleLight5' | 'TableStyleLight6' | 'TableStyleLight7' | 'TableStyleLight8' | 'TableStyleLight9' | 'TableStyleLight10' | 'TableStyleLight11' | 'TableStyleLight12' | 'TableStyleLight13' | 'TableStyleLight14' | 'TableStyleLight15' | 'TableStyleLight16' | 'TableStyleLight17' | 'TableStyleLight18' | 'TableStyleLight19' | 'TableStyleLight20' | 'TableStyleLight21' | 'TableStyleMedium1' | 'TableStyleMedium2' | 'TableStyleMedium3' | 'TableStyleMedium4' | 'TableStyleMedium5' | 'TableStyleMedium6' | 'TableStyleMedium7' | 'TableStyleMedium8' | 'TableStyleMedium9' | 'TableStyleMedium10' | 'TableStyleMedium11' | 'TableStyleMedium12' | 'TableStyleMedium13' | 'TableStyleMedium14' | 'TableStyleMedium15' | 'TableStyleMedium16' | 'TableStyleMedium17' | 'TableStyleMedium18' | 'TableStyleMedium19' | 'TableStyleMedium20' | 'TableStyleMedium21' | 'TableStyleMedium22' | 'TableStyleMedium23' | 'TableStyleMedium24' | 'TableStyleMedium25' | 'TableStyleMedium26' | 'TableStyleMedium27' | 'TableStyleMedium28' | 'TableStyleDark1' | 'TableStyleDark2' | 'TableStyleDark3' | 'TableStyleDark4' | 'TableStyleDark5' | 'TableStyleDark6' | 'TableStyleDark7' | 'TableStyleDark8' | 'TableStyleDark9' | 'TableStyleDark10' | 'TableStyleDark11';
  /** Whether to show header row */
  headerRow?: boolean;
  /** Whether to show total row */
  totalRow?: boolean;
  /** Column definitions */
  columns?: Array<{
    /** Column name */
    name: string;
    /** Column filter button */
    filterButton?: boolean;
    /** Totals row function */
    totalsRowFunction?: 'none' | 'sum' | 'min' | 'max' | 'average' | 'count' | 'countNums' | 'stdDev' | 'var' | 'custom';
    /** Totals row formula */
    totalsRowFormula?: string;
  }>;
}

