import React from 'react';

const TIME_OPTIONS = Array.from({ length: 24 * 2 }, (_, index) => {
	const totalMinutes = index * 30;
	const hour = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
	const minute = String(totalMinutes % 60).padStart(2, '0');
	return `${hour}:${minute}`;
});

export default function Time24Select({ value, onChange, required }) {
	return (
		<select required={required} value={value} onChange={(e) => onChange(e.target.value)}>
			<option value="">--:--</option>
			{TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
		</select>
	);
}
