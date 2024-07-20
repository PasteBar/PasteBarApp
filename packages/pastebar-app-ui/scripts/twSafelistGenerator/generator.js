function cartesian(array) {
    function* cartesian(head, ...tail) {
        let remainder = tail.length ? cartesian(...tail) : [[]]
        for (let r of remainder) for (let h of head) yield [h, ...r]
    }

    return [...cartesian(...array)]
}

function deepKeys(object, separator = '.', prefix = '') {
    return Object.keys(object).reduce((result, key) => {
        if (Array.isArray(object[key])) {
            return [...result, prefix + key];
        } else if (typeof object[key] === 'object' && object[key] !== null) {
            return [...result, ...deepKeys(object[key], separator, prefix + key + separator)];
        }

        return [...result, prefix + key];
  }, []);
}

const extractTokens = pattern =>
    pattern.split(/(?={[^}]+})|(?<={[^}]+})/)

const expandTokens = theme => tokens => {
    return tokens.map(token => {
        if(token.startsWith('{')) {
            const cleanToken = token.replace(/{|}/g, '')
            if(cleanToken.includes('.')) {
                const color = cleanToken.split('.')[1]
                const colorToken = {
                    [color]: theme(cleanToken, {})
                }
                return deepKeys(colorToken, '-')
            }
            return deepKeys(theme(cleanToken, {}), '-')
        } else {
            return [token]
        }
    })
}
    

const mapToClasses = expanded =>
    expanded.map(values =>
        values.join('').replace('-DEFAULT', ''))

module.exports = theme => patterns => {
    return patterns                       // ["text-{gray}", …]
        .map(extractTokens)        // [["text", "{gray}"], …]
        .map(expandTokens(theme))  // [[["text"], ["gray-100", "gray-200",…]], …]
        .map(cartesian)            // [[["text", "gray-100"], ["text", "gray-200"], …], …]
        .flatMap(mapToClasses)     // ["text-gray-100", "text-gray-200",…]
}
    
