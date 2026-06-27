/** Successful API response */
export interface ApiSuccess<T> {
  _status: true;
  _message?: string;
  data: T;
}

/** Failed API response */
export interface ApiFailure {
  _status: false;
  _message: string;
  _error?: unknown;
}

/** Union of success + failure */
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** Paginated list response */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Standard API list query params */
export interface ListQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
}
