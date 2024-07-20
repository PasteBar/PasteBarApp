Object.defineProperty(exports, '__esModule', {
	value: true
});
exports.default = void 0;

var _index = _interopRequireDefault(require('../../../_lib/buildLocalizeFn/index.js'));

function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj };
}

var eraValues = {
	narrow: ['до н.е.', 'н.е.'],
	abbreviated: ['до н. е.', 'н. е.'],
	wide: ['до нашої ери', 'нашої ери']
};
var quarterValues = {
	narrow: ['1', '2', '3', '4'],
	abbreviated: ['1-й кв.', '2-й кв.', '3-й кв.', '4-й кв.'],
	wide: ['1-й квартал', '2-й квартал', '3-й квартал', '4-й квартал']
};
var monthValues = {
	// ДСТУ 3582:2013
	narrow: ['С', 'Л', 'Б', 'К', 'Т', 'Ч', 'Л', 'С', 'В', 'Ж', 'Л', 'Г'],
	abbreviated: [
		'Cіч',
		'Лют',
		'Берез',
		'Квіт',
		'Трав',
		'Черв',
		'Лип',
		'Серп',
		'Верес',
		'Жовт',
		'Листоп',
		'Груд'
	],
	wide: [
		'Січень',
		'Лютий',
		'Березень',
		'Квітень',
		'Травень',
		'Червень',
		'Липень',
		'Серпень',
		'Вересень',
		'Жовтень',
		'Листопад',
		'Грудень'
	]
};
var formattingMonthValues = {
	narrow: ['С', 'Л', 'Б', 'К', 'Т', 'Ч', 'Л', 'С', 'В', 'Ж', 'Л', 'Г'],
	abbreviated: [
		'Січ',
		'Лют',
		'Берез',
		'Квіт',
		'Трав',
		'Черв',
		'Лип',
		'Серп',
		'Верес',
		'Жовт',
		'Листоп',
		'Груд'
	],
	wide: [
		'Січня',
		'Лютого',
		'Березня',
		'Квітня',
		'Травня',
		'Червня',
		'Липня',
		'Серпня',
		'Вересня',
		'Жовтня',
		'Листопада',
		'Грудня'
	]
};
var dayValues = {
	narrow: ['Н', 'П', 'В', 'С', 'Ч', 'П', 'С'],
	short: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
	abbreviated: ['Нед', 'Пон', 'Вів', 'Сер', 'Чтв', 'Птн', 'Суб'],
	wide: ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота']
};
var dayPeriodValues = {
	narrow: {
		am: 'АМ',
		pm: 'PM',
		midnight: 'півн.',
		noon: 'пол.',
		morning: 'ранок',
		afternoon: 'день',
		evening: 'веч.',
		night: 'ніч'
	},
	abbreviated: {
		am: 'АМ',
		pm: 'PM',
		midnight: 'півн.',
		noon: 'пол.',
		morning: 'ранок',
		afternoon: 'день',
		evening: 'веч.',
		night: 'ніч'
	},
	wide: {
		am: 'АМ',
		pm: 'PM',
		midnight: 'північ',
		noon: 'полудень',
		morning: 'ранок',
		afternoon: 'день',
		evening: 'вечір',
		night: 'ніч'
	}
};
var formattingDayPeriodValues = {
	narrow: {
		am: 'АМ',
		pm: 'PM',
		midnight: 'півн.',
		noon: 'пол.',
		morning: 'ранку',
		afternoon: 'дня',
		evening: 'веч.',
		night: 'ночі'
	},
	abbreviated: {
		am: 'АМ',
		pm: 'PM',
		midnight: 'півн.',
		noon: 'пол.',
		morning: 'ранку',
		afternoon: 'дня',
		evening: 'веч.',
		night: 'ночі'
	},
	wide: {
		am: 'АМ',
		pm: 'PM',
		midnight: 'північ',
		noon: 'полудень',
		morning: 'ранку',
		afternoon: 'дня',
		evening: 'веч.',
		night: 'ночі'
	}
};

var ordinalNumber = function ordinalNumber(dirtyNumber, options) {
	var unit = String(options === null || options === void 0 ? void 0 : options.unit);
	var number = Number(dirtyNumber);
	var suffix;

	if (unit === 'date') {
		if (number === 3 || number === 23) {
			suffix = '-є';
		} else {
			suffix = '-е';
		}
	} else if (unit === 'minute' || unit === 'second' || unit === 'hour') {
		suffix = '-а';
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
