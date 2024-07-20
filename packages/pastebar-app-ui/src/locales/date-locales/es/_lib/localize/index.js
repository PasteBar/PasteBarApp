Object.defineProperty(exports, '__esModule', {
	value: true
});
exports.default = void 0;

var _index = _interopRequireDefault(require('../../../_lib/buildLocalizeFn/index.js'));

function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj };
}

var eraValues = {
	narrow: ['AC', 'DC'],
	abbreviated: ['AC', 'DC'],
	wide: ['antes de cristo', 'después de cristo']
};
var quarterValues = {
	narrow: ['1', '2', '3', '4'],
	abbreviated: ['T1', 'T2', 'T3', 'T4'],
	wide: ['1º trimestre', '2º trimestre', '3º trimestre', '4º trimestre']
};
var monthValues = {
	narrow: ['e', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'],
	abbreviated: [
		'Ene',
		'Feb',
		'Mar',
		'Abr',
		'May',
		'Jun',
		'Jul',
		'Ago',
		'Sep',
		'Oct',
		'Nov',
		'Dic'
	],
	wide: [
		'Enero',
		'Febrero',
		'Marzo',
		'Abril',
		'Mayo',
		'Junio',
		'Julio',
		'Agosto',
		'Septiembre',
		'Octubre',
		'Noviembre',
		'Diciembre'
	]
};
var dayValues = {
	narrow: ['d', 'l', 'm', 'm', 'j', 'v', 's'],
	short: ['do', 'lu', 'ma', 'mi', 'ju', 'vi', 'sá'],
	abbreviated: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
	wide: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
};
var dayPeriodValues = {
	narrow: {
		am: 'a',
		pm: 'p',
		midnight: 'mn',
		noon: 'md',
		morning: 'mañana',
		afternoon: 'tarde',
		evening: 'tarde',
		night: 'noche'
	},
	abbreviated: {
		am: 'AM',
		pm: 'PM',
		midnight: 'medianoche',
		noon: 'mediodia',
		morning: 'mañana',
		afternoon: 'tarde',
		evening: 'tarde',
		night: 'noche'
	},
	wide: {
		am: 'a.m.',
		pm: 'p.m.',
		midnight: 'medianoche',
		noon: 'mediodia',
		morning: 'mañana',
		afternoon: 'tarde',
		evening: 'tarde',
		night: 'noche'
	}
};
var formattingDayPeriodValues = {
	narrow: {
		am: 'a',
		pm: 'p',
		midnight: 'mn',
		noon: 'md',
		morning: 'de la mañana',
		afternoon: 'de la tarde',
		evening: 'de la tarde',
		night: 'de la noche'
	},
	abbreviated: {
		am: 'AM',
		pm: 'PM',
		midnight: 'medianoche',
		noon: 'mediodia',
		morning: 'de la mañana',
		afternoon: 'de la tarde',
		evening: 'de la tarde',
		night: 'de la noche'
	},
	wide: {
		am: 'a.m.',
		pm: 'p.m.',
		midnight: 'medianoche',
		noon: 'mediodia',
		morning: 'de la mañana',
		afternoon: 'de la tarde',
		evening: 'de la tarde',
		night: 'de la noche'
	}
};

var ordinalNumber = function ordinalNumber(dirtyNumber) {
	var number = Number(dirtyNumber);
	return number + 'º';
};

var localize = {
	ordinalNumber: ordinalNumber,
	era: (0, _index.default)({
		values: eraValues,
		defaultWidth: 'wide'
	}),
	quarter: (0, _index.default)({
		values: quarterValues,
		defaultWidth: 'wide',
		argumentCallback: function argumentCallback(quarter) {
			return Number(quarter) - 1;
		}
	}),
	month: (0, _index.default)({
		values: monthValues,
		defaultWidth: 'wide'
	}),
	day: (0, _index.default)({
		values: dayValues,
		defaultWidth: 'wide'
	}),
	dayPeriod: (0, _index.default)({
		values: dayPeriodValues,
		defaultWidth: 'wide',
		formattingValues: formattingDayPeriodValues,
		defaultFormattingWidth: 'wide'
	})
};
var _default = localize;
exports.default = _default;
module.exports = exports.default;
