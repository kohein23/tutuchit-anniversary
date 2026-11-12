import { useState, useEffect } from 'react';

export const useTimer = (startDate: Date | string | number, includeTime: boolean = true) => {
  const [time, setTime] = useState({
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const startTime = new Date(startDate).getTime();

  useEffect(() => {
    const calculateTime = () => {
      const start = new Date(startTime);
      const now = new Date();
      let years = now.getFullYear() - start.getFullYear();
      let months = now.getMonth() - start.getMonth();
      let days = now.getDate() - start.getDate();
      let hours = now.getHours() - start.getHours();
      let minutes = now.getMinutes() - start.getMinutes();
      let seconds = now.getSeconds() - start.getSeconds();

      if (includeTime) {
        if (seconds < 0) {
          seconds += 60;
          minutes--;
        }
        if (minutes < 0) {
          minutes += 60;
          hours--;
        }
        if (hours < 0) {
          hours += 24;
          days--;
        }
      } else {
        hours = 0;
        minutes = 0;
        seconds = 0;
      }

      if (days < 0) {
        // Get the number of days in the previous month
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += prevMonth.getDate();
        months--;
      }
      if (months < 0) {
        months += 12;
        years--;
      }

      setTime({
        years: Math.max(0, years),
        months: Math.max(0, months),
        days: Math.max(0, days),
        hours: Math.max(0, hours),
        minutes: Math.max(0, minutes),
        seconds: Math.max(0, seconds)
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [startTime, includeTime]);

  return time;
};
