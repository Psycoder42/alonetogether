// Factory for creating page render callbacks
module.exports.genRenderCallback = (response, callback, customData=null) => {
  return (err, data) => {
    if (err) {
      // Something went wrong.
      // instead of the expected data, return and object with _error property
      callback(response, { _error: err }, customData);
    } else {
      // Pass the response object and DB result data to the callback
      callback(response, data, customData);
    }
  };
}

// Return a boolean based on whether a checkbox was checked (value of 'on')
module.exports.isChecked = (value) => {
  return (value == 'on');
}

// Return a trimmed string. If the string is empty and a default was
// passed, return the default instead
module.exports.cleanString = (str, fallback=null) => {
  let cleaned = (str ? str.trim() : '');
  if (cleaned.length==0 && fallback!=null) {
    return fallback;
  }
  return cleaned;
}

// Return an integer. If num in NaN, the default will be return (null if no default)
// The min and Max bounds will only be applied to the num, not the default
module.exports.cleanInt = (num, fallback=null, min=null, max=null) => {
  let int = parseInt(num);
  if (isNaN(int)) {
    return fallback;
  }
  if (min != null) {
    int = Math.max(int, min);
  }
  if (max != null) {
    int = Math.min(int, max);
  }
  return int;
}

// Return an float. If num in NaN, the default will be return (null if no default)
// The constraints will only be applied to the num, not the default
module.exports.cleanFloat = (num, fallback=null, decimalPlaces=null, min=null, max=null) => {
  let float = parseFloat(num);
  if (isNaN(float)) {
    return fallback;
  }
  if (min != null) {
    float = Math.max(float, min);
  }
  if (max != null) {
    float = Math.min(float, max);
  }
  if (decimalPlaces != null) {
    float = parseFloat(float.toFixed(decimalPlaces));
  }
  return float;
}

// Convert a comma-separated string to an array of strings or
// use default if provided and the array has no values
module.exports.parseArray = (str, fallback=null) => {
  let array = str.trim().split(/[\s]*,[\s,]*/);
  array = array.reduce((arr, elem)=>{
    if (elem.length>0) arr.push(elem);
    return arr;
  },[]);
  if (cleanedArray.length==0 && fallback!=null) {
    return fallback;
  }
  return array;
}
