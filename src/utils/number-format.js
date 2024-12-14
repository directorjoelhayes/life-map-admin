export const formatMoney = formatWrapper((number) => {

    if (number === undefined || number === null) {
        return "0.00"
    }

    const reducer = (acc, current, index, src) => {
        let i = src.length - index - 1;
        if (i % 3 == 0 && i < src.length && i > 0) {
            acc.push(',');
        }
        acc.push(current);
        return acc;
    }

    let numbArray = Math.abs(number).toString();

    if (number % 1 != 0) {
        //number has decimal
        numbArray = numbArray.split('.')[0];
    }

    numbArray = numbArray
        .split('')
        .reduceRight(reducer, [])
        .reverse()
        .join('');

    if (number < 0) {
        numbArray = "-" + numbArray;
    }

    if (number % 1 != 0) {
        //decimal back
        numbArray = numbArray + '.' + number.toFixed(2).toString().split('.')[1];
        return numbArray;
    } else if (!number) {
        return "0.00"
    } else {
        return numbArray + ".00"
    }

})

export const formatPhone = formatWrapper((number) => {
    function stripFormatting(phoneNumber) {
        let formattedNumber = "";
        for (let i = 0; i < phoneNumber.length; i++) {
            if (parseInt(phoneNumber.charAt(i)) >= 0) {
                formattedNumber += phoneNumber.charAt(i);
            }
        }
        return formattedNumber;
    }

    phoneNumber = stripFormatting(phoneNumber);
    let length = phoneNumber.length;
    if (length == 10) {
        phoneNumber = phoneNumber.substring(0, 3) + '-' + phoneNumber.substring(3, 6) + '-' + phoneNumber.substring(6);
        return phoneNumber;
    }
})
export const formatClock = formatWrapper((duration) => {
    let milliseconds = parseInt((duration % 1000) / 100)
        , seconds = parseInt((duration / 1000) % 60)
        , minutes = parseInt((duration / (1000 * 60)) % 60)
        , hours = parseInt((duration / (1000 * 60 * 60)) % 24);

    let hoursString = (hours < 10) ? "0" + hours : hours;
    let minutesString = (minutes < 10) ? "0" + minutes : minutes;
    let secondsString = (seconds < 10) ? "0" + seconds : seconds;

    let string = "";
    if (hours) string += hoursString + ":";
    if (minutes) string += minutesString + ":";
    string += secondsString;
    return string;
})

export const formatDate = formatWrapper((date) => {
    // Ensure that the input date is a Date object
    if (!(date instanceof Date)) {
        date = new Date(date);
    }

    // Get the components of the date
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is zero-based
    const day = String(date.getDate()).padStart(2, '0');

    // Create the formatted date string in MM/DD/YYYY format
    const formattedDate = `${month}/${day}/${year}`;
    return formattedDate;
})

// export const formatDateTime = formatWrapper((date) => {
//     const yourDate = new Date(date);

//     const options = {
//         month: '2-digit',
//         day: '2-digit',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit',
//         hour12: true,
//     };

//     return yourDate.toLocaleDateString('en-US', options)
// })

export const millToDays = formatWrapper((time) => {
    return (time / (1000 * 60 * 60 * 24)).toFixed(2) + " day/s"
})

export const formatFloat = formatWrapper((number) => {

    return number.toFixed(4);

})
export const formatPercentage = formatWrapper((number) => {
    return (number * 100).toFixed(2)
})

export const formatPriceRange = formatWrapper((range) => {
    if (range.every(num => num === range[0])) {
        return "$" + formatMoney(range[0]);
    } else {
        return `
            $${formatMoney(Math.min(Infinity, ...range))} - $${formatMoney(Math.max(0, ...range))}
        `;
    }
})

export const formatDateTime = formatWrapper((timestamp) => {
    const date = new Date(timestamp);
  
    // Format date
    let month = date.getMonth() + 1; // Months are zero-based
    let day = date.getDate();
    let year = date.getFullYear();
  
    // Format time
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // The hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
  
    const formattedDate = `${month}/${day}/${year}`;
    const formattedTime = `${hours}:${minutes} ${ampm}`;
  
    return `${formattedDate} ${formattedTime}`;
})

function formatWrapper(func) {
    return (val) => {
        if (
            val === "loading" ||
            val === undefined ||
            val === null ||
            val === NaN
        ) return "...";
        else return func(val)
    }
}