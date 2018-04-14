const autoBind = require('auto-bind');
class BaseAutoBindedClass {
	constructor() {
		autoBind(this);
	}
}

export default BaseAutoBindedClass;