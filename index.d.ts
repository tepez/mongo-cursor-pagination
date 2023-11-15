/**
 * Based on https://github.com/mixmaxhq/mongo-cursor-pagination/blob/v7.3.1/README.md
 */
declare module '@tepez/mongo-cursor-pagination' {
  import { Document, FilterQuery, HydratedDocument, Schema, TreatAsPrimitives, Types } from 'mongoose';

  // copy LeanDocument from mongoose 6.11.1 because it was removed in 7.0.0 and we need it to infer the lean type from the document
  // https://github.com/Automattic/mongoose/blob/6.11.1/types/index.d.ts

  type LeanType<T> =
    0 extends (1 & T) ? T : // any
      T extends TreatAsPrimitives ? T : // primitives
        T extends Types.ArraySubdocument ? Omit<LeanDocument<T>, 'parentArray' | 'ownerDocument' | 'parent'> :
          T extends Types.Subdocument ? Omit<LeanDocument<T>, '$isSingleNested' | 'ownerDocument' | 'parent'> :
            LeanDocument<T>; // Documents and everything else
  type LeanArray<T extends unknown[]> = T extends unknown[][] ? LeanArray<T[number]>[] : LeanType<T[number]>[];

  type _LeanDocument<T> = {
    [K in keyof T]: LeanDocumentElement<T[K]>;
  };

  // Keep this a separate type, to ensure that T is a naked type.
  // This way, the conditional type is distributive over union types.
  // This is required for PopulatedDoc.
  type LeanDocumentElement<T> =
    T extends unknown[] ? LeanArray<T> : // Array
      T extends Document ? LeanDocument<T> : // Subdocument
        T;

  type LeanDocument<T> = Omit<_LeanDocument<T>, Exclude<keyof Document, '_id' | 'id' | '__v'> | '$isSingleNested'>;

  type MongoosePlugin = Parameters<Schema['plugin']>[0]

  export interface ICursorPaginationMongoosePluginOptions {
    /**
     * custom function name
     * @default paginate
     */
    name?: string;
  }

  export interface IPaginateOptions<T extends Document> {
    /**
     * The find query
     */
    query: FilterQuery<T>;

    /**
     * The page size. Must be between 1 and `config.MAX_LIMIT`.
     */
    limit: number;

    /**
     * Fields to query in the Mongo object format, e.g. {_id: 1, timestamp :1}.
     * @default query all fields.
     */
    fields?: any;

    /**
     * The field name to query the range for. The field must be:
     * 1. Orderable. We must sort by this value. If duplicate values for paginatedField field
     * exist, the results will be secondarily ordered by the _id.
     * 2. Indexed. For large collections, this should be indexed for query performance.
     * 3. Immutable. If the value changes between paged queries, it could appear twice.
     * 4. Complete. A value must exist for all documents.
     * The default is to use the Mongo built-in '_id' field, which satisfies the above criteria.
     * The only reason to NOT use the Mongo _id field is if you chose to implement your own ids.
     * @default _id
     */
    paginatedField?: string;

    /**
     * True to sort using paginatedField ascending
     * @default false - descending
     */
    sortAscending?: boolean;

    /**
     * The value to start querying the page.
     */
    next?: string;

    /**
     * The value to start querying previous page.
     */
    previous?: string;
  }

  export interface IPaginateResult<T extends Document> {
    results: HydratedDocument<T>[];
    previous?: string;
    /**
     * base64 encoded
     * Contains the ID of the last object in the page
     */
    next: string;
    hasNext: boolean;
  }

  export interface ICursorPaginationExtendedModel<T extends Document> {
    paginate(options: IPaginateOptions<T>): IPaginateResult<T>;
  }

  export const mongoosePlugin: MongoosePlugin;

  export const config: {
    /**
     * @default 50
     */
    DEFAULT_LIMIT: number

    /**
     * @default 300
     */
    MAX_LIMIT: number
  };
}