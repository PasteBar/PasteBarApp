Object.defineProperty(exports, '__esModule', {
	value: true
});
exports.default = void 0;

var _index = _interopRequireDefault(require('../../../_lib/buildLocalizeFn/index.js'));

function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj };
}

var eraValues = {
	narrow: ['до н.э.', 'н.э.'],
	abbreviated: ['до н. э.', 'н. э.'],
	wide: ['до нашей эры', 'нашей эры']
};
var quarterValues = {
	narrow: ['1', '2', '3', '4'],
	abbreviated: ['1-й кв.', '2-й кв.', '3-й кв.', '4-й кв.'],
	wide: ['1-й квартал', '2-й квартал', '3-й квартал', '4-й квартал']
};
var monthValues = {
	narrow: ['Я', 'Ф', 'М', 'А', 'М', 'И', 'И', 'А', 'С', 'О', 'Н', 'Д'],
	abbreviated: [
		'Янв',
		'Фев',
		'Март',
		'Апр',
		'Май',
		'Июнь',
		'Июль',
		'Aвг',
		'Cент',
		'Окт',
		'Нояб',
		'Дек'
	],
	wide: [
		'Январь',
		'Февраль',
		'Март',
		'Апрель',
		'Май',
		'Июнь',
		'Июль',
		'Август',
		'Сентябрь',
		'Октябрь',
		'Ноябрь',
		'Декабрь'
	]
};
var formattingMonthValues = {
	narrow: ['Я', 'Ф', 'М', 'А', 'М', 'И', 'И', 'А', 'С', 'О', 'Н', 'Д'],
	abbreviated: [
		'Янв',
		'Фев',
		'Март',
		'Апр',
		'Май',
		'Июнь',
		'Июль',
		'Aвг',
		'Cент',
		'Окт',
		'Нояб',
		'Дек'
	],
	wide: [
		'Января',
		'Февраля',
		'Марта',
		'Апреля',
		'Мая',
		'Июня',
		'Июля',
		'Августа',
		'Сентября',
		'Октября',
		'Ноября',
		'Декабря'
	]
};
var dayValues = {
	narrow: ['В', 'П', 'В', 'С', 'Ч', 'П', 'С'],
	short: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
	abbreviated: ['Вск', 'Пнд', 'Втр', 'Срд', 'Чтв', 'Птн', 'Суб'],
	wide: [
		'Воскресенье',
		'Понедельник',
		'Вторник',
		'Среда',
		'Четверг',
		'Пятница',
		'Суббота'
	]
};
var dayPeriodValues = {
	narrow: {
		am: 'АМ',
		pm: 'PM',
		midnight: 'полн.',
		noon: 'полд.',
		morning: 'утро',
		afternoon: 'день',
		evening: 'веч.',
		night: 'ночь'
	},
	abbreviated: {
		am: 'АМ',
		pm: 'PM',
		midnight: 'полн.',
		noon: 'полд.',
		morning: 'утро',
		afternoon: 'день',
		evening: 'веч.',
		night: 'ночь'
	},
	wide: {
		am: 'AM',
		pm: 'PM',
		midnight: 'полночь',
		noon: 'полдень',
		morning: 'утро',
		afternoon: 'день',
		evening: 'вечер',
		night: 'ночь'
	}
};
var formattingDayPeriodValues = {
	narrow: {
		am: 'AM',
		pm: 'PM',
		midnight: 'полн.',
		noon: 'полд.',
		morning: 'утра',
		afternoon: 'дня',
		evening: 'веч.',
		night: 'ночи'
	},
	abbreviated: {
		am: 'AM',
		pm: 'PM',
		midnight: 'полн.',
		noon: 'полд.',
		morning: 'утра',
		afternoon: 'дня',
		evening: 'веч.',
		night: 'ночи'
	},
	wide: {
		am: 'AM',
		pm: 'PM',
		midnight: 'полночь',
		noon: 'полдень',
		morning: 'утра',
		afternoon: 'дня',
		evening: 'вечера',
		night: 'ночи'
	}
};

var ordinalNumber = function ordinalNumber(dirtyNumber, options) {
	var number = Number(dirtyNumber);
	var unit = options === null || options === void 0 ? void 0 : options.unit;
	var suffix;

	if (unit === 'date') {
		suffix = '-е';
	} else if (unit === 'week' || unit === 'minute' || unit === 'second') {
		suffix = '-я';
	} else {
		suffix = '-й';
	}

	return number + suffix;
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
			return quarter - 1;
		}
	}),
	month: (0, _index.default)({
		values: monthValues,
		defaultWidth: 'wide',
		formattingValues: formattingMonthValues,
		defaultFormattingWidth: 'wide'
	}),
	day: (0, _index.default)({
		values: dayValues,
		defaultWidth: 'wide'
	}),
	dayPeriod: (0, _index.default)({
		values: dayPeriodValues,
		defaultWidth: 'any',
		formattingValues: formattingDayPeriodValues,
		defaultFormattingWidth: 'wide'
	})
};
var _default = localize;
exports.default = _default;
module.exports = exports.default;
