// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export default function wildCardSearch(
  list: Array<Record<string, string | number>>,
  input: string,
  specifyKey?: string
) {
  const searchText = (item: Record<string, string | number>) => {
    for (const key in item) {
      if (item[specifyKey ? specifyKey : key] == null) {
        continue
      }
      if (
        item[specifyKey ? specifyKey : key]
          .toString()
          .toUpperCase()
          .indexOf(input.toString().toUpperCase()) !== -1
      ) {
        return true
      }
    }
  }
  return list.filter(value => searchText(value))
}
