type Primitive = string | number | boolean

export type Primer = (value: Primitive) => Primitive

const sortBy = <T extends Record<string, Primitive>>(
  field: keyof T,
  reverse: boolean,
  primer?: (value: Primitive) => Primitive
) => {
  const key = primer
    ? function (x: T) {
        return primer(x[field])
      }
    : function (x: T) {
        return x[field]
      }
  const isReverse = !reverse ? 1 : -1
  return function (a: T, b: T) {
    const valueA = key(a)
    const valueB = key(b)
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return isReverse * valueA.localeCompare(valueB)
    }
    return isReverse * (valueA > valueB ? 1 : valueB > valueA ? -1 : 0)
  }
}

export default sortBy
