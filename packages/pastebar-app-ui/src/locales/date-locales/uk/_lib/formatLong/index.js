Object.defineProperty(exports, '__esModule', {
	value: true
});
exports.default = void 0;

var _index = _interopRequireDefault(require('../../../_lib/buildFormatLongFn/index.js'));

function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj };
}

var dateFormats = {
	full: 'EEEE, do MMMM y',
	long: 'do MMMM y',
	medium: 'd MMM y',
	short: 'dd.MM.y'
};
var timeFormats = {
	full: 'H:mm:ss zzzz',
	long: 'H:mm:ss z',
	medium: 'H:mm:ss',
	short: 'H:mm'
};
var dateTimeFormats = {
	full: "{{date}} 'о' {{time}}",
	long: "{{date}} 'о' {{time}}",
	medium: '{{date}}, {{time}}',
	short: '{{date}}, {{time}}'
};
var formatLong = {
	date: (0, _index.default)({
		formats: dateFormats,
		defaultWidth: 'full'
	}),
	time: (0, _index.default)({
		formats: timeFormats,
		defaultWidth: 'full'
	}),
	dateTime: (0, _index.default)({
		formats: dateTimeFormats,
		defaultWidth: 'full'
	})
};
var _default = formatLong;
exports.default = _default;
module.exports = exports.default;
