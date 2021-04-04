
module.exports = class Common {
  static obj;
  constructor(obj) {
    Common.obj = obj;   
  }
  static get() {
    return Common.obj;
  }
  static set(obj) {
    Common.obj  = obj;
  }
  static add(newValues) {
    Common.obj  = {
        ...Common.obj,
        ...newValues
    }
  }
};
