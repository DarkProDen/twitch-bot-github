const numberToTime = milliseconds => {
  let hours = Math.floor(milliseconds / 3600000);
  let minutes = Math.floor((milliseconds - hours * 3600000) / 60000);
  let seconds = Math.floor(
    (milliseconds - hours * 3600000 - minutes * 60000) / 1000
  );

  if (hours < 10) {
    hours = '0' + hours.toString();
  }
  if (minutes < 10) {
    minutes = '0' + minutes.toString();
  }
  if (seconds < 10) {
    seconds = '0' + seconds.toString();
  }

  return `${hours}:${minutes}:${seconds}`;
};

module.exports = numberToTime;
