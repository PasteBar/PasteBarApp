Object.defineProperty(exports, '__esModule', {
	value: true
});
exports.default = buildFormatLongFn;

function buildFormatLongFn(args) {
	return function () {
		var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
		// TODO: Remove String()
		var width = options.width ? String(options.width) : args.defaultWidth;
		return args.formats[width] || args.formats[args.defaultWidth];
	};
}

module.exports = exports.default;
