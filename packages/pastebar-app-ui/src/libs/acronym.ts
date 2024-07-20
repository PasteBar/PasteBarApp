export default function acronym(name = '') {
  const shortName = name.match(/\b(\w)/g)

  if (shortName) {
    return shortName.join('')
  }

  return name
}
