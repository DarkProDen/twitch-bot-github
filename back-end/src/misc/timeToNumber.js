const timeToNumber = timeString => {
  const numbers = timeString.split(':');
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  hours = numbers[0];
  minutes = numbers[1];

  if (numbers.length === 3) {
    seconds = numbers[2];
  }

  return hours * 3600000 + minutes * 60000 + seconds * 1000;
};

module.exports = timeToNumber;
