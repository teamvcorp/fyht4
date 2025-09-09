import { ObjectId } from 'mongodb'

export type Plain<T> = {
  [K in keyof T]:
    T[K] extends ObjectId ? string :
    T[K] extends Date ? string :
    T[K] extends object ? Plain<T[K]> :
    T[K]
}

/** Convert Mongo doc to plain JSON-safe object */
export function serializeDoc<T extends Record<string, any>>(doc: T): Plain<T> {
  return JSON.parse(JSON.stringify(doc, (_key, value) => {
    if (value instanceof ObjectId) return value.toString()
    if (value instanceof Date) return value.toISOString()
    return value
  }))
}

export function serializeDocs<T extends Record<string, any>>(docs: T[]): Plain<T>[] {
  return docs.map(serializeDoc)
}
