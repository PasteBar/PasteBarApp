// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const paginate = (array: Array<any>, pageSize: number, pageNumber: number) => {
  return array.slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
}

export default paginate
